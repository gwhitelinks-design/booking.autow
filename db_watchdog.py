#!/usr/bin/env python3
"""
Database Watchdog - Polls Supabase for agent issues
Monitors for BLOCKED/FAILED tasks and alerts for Claude Code intervention

Run: python db_watchdog.py
"""

import os
import sys
import time
import json
from datetime import datetime, timezone
from pathlib import Path

# Add AgenticOS to path for imports
sys.path.insert(0, 'D:/Projects-AI/Agentic/AgenticOSKevsAcademy-main')

from dotenv import load_dotenv
load_dotenv('D:/Projects-AI/Agentic/AgenticOSKevsAcademy-main/.env')

import psycopg2
from psycopg2.extras import RealDictCursor

# Configuration
POLL_INTERVAL = 30  # seconds
REPORTS_DIR = Path("D:/Projects-AI/autow-booking/agent_reports")
STATUS_FILE = Path("D:/Projects-AI/autow-booking/agent_status.json")

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)

def check_for_issues():
    """Check database for tasks needing intervention"""
    conn = get_db_connection()
    cur = conn.cursor()

    issues = []

    # Check for failed tasks
    cur.execute('''
        SELECT t.id, t.name, t.task_type, t.status, p.name as project_name
        FROM tasks t
        JOIN projects p ON t.project_id = p.id
        WHERE t.status IN ('failed', 'blocked')
        AND p.status = 'in_progress'
    ''')
    failed_tasks = cur.fetchall()

    for task in failed_tasks:
        issues.append({
            'type': 'FAILED_TASK',
            'task_id': task['id'],
            'task_name': task['name'],
            'task_type': task['task_type'],
            'project': task['project_name'],
            'status': task['status']
        })

    # Check for stuck tasks (in_progress for too long)
    cur.execute('''
        SELECT t.id, t.name, t.task_type, t.updated_at, p.name as project_name
        FROM tasks t
        JOIN projects p ON t.project_id = p.id
        WHERE t.status = 'in_progress'
        AND t.updated_at < NOW() - INTERVAL '10 minutes'
    ''')
    stuck_tasks = cur.fetchall()

    for task in stuck_tasks:
        issues.append({
            'type': 'STUCK_TASK',
            'task_id': task['id'],
            'task_name': task['name'],
            'task_type': task['task_type'],
            'project': task['project_name'],
            'updated_at': str(task['updated_at'])
        })

    # Check for error logs
    cur.execute('''
        SELECT agent_name, message, created_at, project_id
        FROM project_logs
        WHERE message ILIKE '%error%' OR message ILIKE '%failed%' OR message ILIKE '%blocked%'
        AND created_at > NOW() - INTERVAL '5 minutes'
        ORDER BY created_at DESC
        LIMIT 5
    ''')
    error_logs = cur.fetchall()

    for log in error_logs:
        issues.append({
            'type': 'ERROR_LOG',
            'agent': log['agent_name'],
            'message': log['message'][:200] if log['message'] else '',
            'time': str(log['created_at'])
        })

    conn.close()
    return issues

def get_project_status():
    """Get current project and task status"""
    conn = get_db_connection()
    cur = conn.cursor()

    # Get Smart Jotter project
    cur.execute('''
        SELECT id, name, status
        FROM projects
        WHERE name LIKE '%Smart Jotter%'
        ORDER BY created_at DESC
        LIMIT 1
    ''')
    project = cur.fetchone()

    if not project:
        conn.close()
        return None

    # Get task counts
    cur.execute('''
        SELECT status, COUNT(*) as count
        FROM tasks
        WHERE project_id = %s
        GROUP BY status
    ''', (project['id'],))
    counts = {row['status']: row['count'] for row in cur.fetchall()}

    # Get agent status
    cur.execute('SELECT agent_name, status, last_heartbeat FROM agent_status')
    agents = cur.fetchall()

    conn.close()

    return {
        'project': dict(project),
        'tasks': counts,
        'agents': [dict(a) for a in agents]
    }

def write_alert(issues):
    """Write alert file for issues found"""
    REPORTS_DIR.mkdir(exist_ok=True)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    alert_file = REPORTS_DIR / f"ALERT_{timestamp}.md"

    content = f"""# ALERT - Agent Issues Detected
**Timestamp:** {datetime.now().isoformat()}
**Status:** NEEDS ATTENTION

## Issues Found

"""
    for issue in issues:
        content += f"### {issue['type']}\n"
        for key, value in issue.items():
            if key != 'type':
                content += f"- **{key}:** {value}\n"
        content += "\n"

    content += """
## Action Required

Claude Code intervention needed. Options:
1. Check the task details in Supabase
2. Provide guidance in agent_guidance/ folder
3. Manually fix and retry the task

"""

    with open(alert_file, 'w', encoding='utf-8') as f:
        f.write(content)

    return alert_file

def display_status(status, issues):
    """Display current status in terminal"""
    os.system('cls' if os.name == 'nt' else 'clear')

    print("=" * 70)
    print("       DATABASE WATCHDOG - Smart Jotter Monitor")
    print("       Press Ctrl+C to stop")
    print("=" * 70)
    print()

    if status:
        print(f"Project: {status['project']['name']}")
        print(f"Status:  {status['project']['status']}")
        print()

        # Task summary
        print("Tasks:")
        total = sum(status['tasks'].values())
        for s, count in status['tasks'].items():
            bar = '#' * count + '.' * (total - count)
            print(f"  {s:15} [{bar[:20]}] {count}")
        print()

        # Agent status
        print("Agents:")
        for agent in status['agents']:
            hb = agent.get('last_heartbeat')
            if hb:
                age = (datetime.now(timezone.utc) - hb).total_seconds()
                if age < 120:
                    status_str = "ACTIVE"
                else:
                    status_str = f"{int(age/60)}m ago"
            else:
                status_str = "NEVER"
            print(f"  {agent['agent_name']:25} {agent['status']:10} {status_str}")
        print()

    # Issues
    if issues:
        print("!" * 70)
        print("  ISSUES DETECTED - INTERVENTION NEEDED")
        print("!" * 70)
        for issue in issues:
            print(f"  [{issue['type']}] {issue.get('task_name', issue.get('message', ''))[:50]}")
        print()
    else:
        print("[OK] No issues detected")

    print()
    print(f"Last check: {datetime.now().strftime('%H:%M:%S')} | Next in {POLL_INTERVAL}s")

def main():
    print("Starting Database Watchdog...")
    print(f"Polling every {POLL_INTERVAL} seconds")
    print()

    REPORTS_DIR.mkdir(exist_ok=True)

    last_issues = []

    try:
        while True:
            try:
                status = get_project_status()
                issues = check_for_issues()

                display_status(status, issues)

                # Write alert if new issues
                if issues and issues != last_issues:
                    alert_file = write_alert(issues)
                    print(f"\n[ALERT] Written to: {alert_file}")

                last_issues = issues

            except Exception as e:
                print(f"\n[ERROR] {e}")

            time.sleep(POLL_INTERVAL)

    except KeyboardInterrupt:
        print("\n\nWatchdog stopped.")

if __name__ == '__main__':
    main()
