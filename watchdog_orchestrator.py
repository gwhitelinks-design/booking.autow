#!/usr/bin/env python3
"""
watchdog_orchestrator.py
Monitors agent reports and facilitates Claude Code intervention

Usage:
    python watchdog_orchestrator.py

Requirements:
    pip install watchdog
"""

import os
import time
import json
from datetime import datetime
from pathlib import Path

try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError:
    print("Installing watchdog...")
    os.system("pip install watchdog")
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler

# Paths - Update these for your environment
PROJECT_ROOT = Path("D:/Projects-AI/autow-booking")
REPORTS_DIR = PROJECT_ROOT / "agent_reports"
GUIDANCE_DIR = PROJECT_ROOT / "agent_guidance"
STATUS_FILE = PROJECT_ROOT / "agent_status.json"

class ReportHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.src_path.endswith('.md'):
            self.process_report(event.src_path)

    def process_report(self, filepath):
        filename = os.path.basename(filepath)

        # Parse filename: mk3_implementation_2026-01-05_143022_ERROR.md
        parts = filename.replace('.md', '').split('_')
        agent = parts[0]  # mk3
        status = parts[-1]  # ERROR, BLOCKED, QUESTION, COMPLETE

        # Read content
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Update status file
        self.update_status(agent, status, filename, content)

        # Alert based on status
        if status in ['ERROR', 'BLOCKED', 'QUESTION']:
            self.alert_orchestrator(agent, status, content, filepath)
        elif status == 'COMPLETE':
            print(f"[{datetime.now().strftime('%H:%M:%S')}] {agent} completed task")
        elif status == 'PROGRESS':
            print(f"[{datetime.now().strftime('%H:%M:%S')}] {agent} progress update")

    def update_status(self, agent, status, filename, content):
        status_data = {}
        if STATUS_FILE.exists():
            with open(STATUS_FILE, 'r') as f:
                status_data = json.load(f)

        status_data[agent] = {
            'status': status,
            'last_report': filename,
            'timestamp': datetime.now().isoformat(),
            'needs_attention': status in ['ERROR', 'BLOCKED', 'QUESTION']
        }

        with open(STATUS_FILE, 'w') as f:
            json.dump(status_data, f, indent=2)

    def alert_orchestrator(self, agent, status, content, filepath):
        """Alert Claude Code CLI that intervention is needed"""
        print("\n" + "="*70)
        print(f" ATTENTION REQUIRED: {agent.upper()} - {status}")
        print("="*70)
        print(f"\n Report: {filepath}")
        print(f" Guidance folder: {GUIDANCE_DIR}")
        print("\n" + "-"*70)
        print(" REPORT CONTENT:")
        print("-"*70)
        # Show first 800 chars
        print(content[:800])
        if len(content) > 800:
            print(f"\n... [{len(content) - 800} more characters]")
        print("-"*70)
        print("\n ACTION REQUIRED:")
        print(f" 1. Review the error/question above")
        print(f" 2. Create guidance file: {GUIDANCE_DIR}/{agent}_guidance_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md")
        print(f" 3. Agent will pick up guidance on next run")
        print("="*70 + "\n")


def show_current_status():
    """Display current agent status"""
    if STATUS_FILE.exists():
        with open(STATUS_FILE, 'r') as f:
            status = json.load(f)

        print("\n" + "-"*50)
        print(" CURRENT AGENT STATUS")
        print("-"*50)
        for agent, data in status.items():
            attention = " [!] NEEDS ATTENTION" if data.get('needs_attention') else ""
            print(f" {agent}: {data['status']}{attention}")
        print("-"*50 + "\n")


def main():
    # Create directories
    REPORTS_DIR.mkdir(exist_ok=True)
    GUIDANCE_DIR.mkdir(exist_ok=True)

    print("\n" + "="*70)
    print("       AGENTICEOS WATCHDOG ORCHESTRATOR")
    print("       Smart Jotter Project Monitor")
    print("="*70)
    print(f"\n Project:   {PROJECT_ROOT}")
    print(f" Reports:   {REPORTS_DIR}")
    print(f" Guidance:  {GUIDANCE_DIR}")
    print(f" Status:    {STATUS_FILE}")
    print("\n" + "="*70)

    # Show current status if exists
    show_current_status()

    print(" Watching for agent reports...")
    print(" Press Ctrl+C to stop\n")

    event_handler = ReportHandler()
    observer = Observer()
    observer.schedule(event_handler, str(REPORTS_DIR), recursive=False)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print('\n\nWatchdog stopped.')
        observer.stop()
    observer.join()


if __name__ == '__main__':
    main()
