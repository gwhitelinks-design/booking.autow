# Smart Jotter - AgenticOS Deployment Plan

**Created:** 2026-01-05
**Project:** AUTOW Booking System
**Feature:** Smart Jotter (Handwriting Recognition + AI Parsing)

---

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [Architecture](#architecture)
3. [Two-Tier Orchestration](#two-tier-orchestration)
4. [Communication Protocol](#communication-protocol)
5. [MK Agent Roles & Tasks](#mk-agent-roles--tasks)
6. [Watchdog Orchestrator Script](#watchdog-orchestrator-script)
7. [Workflow Sequence](#workflow-sequence)
8. [File Structure](#file-structure)
9. [Cost Estimate](#cost-estimate)
10. [Deployment Steps](#deployment-steps)

---

## Feature Overview

### What We're Building

A **Smart Jotter** feature that:
1. Accepts handwritten notes (tablet/phone) OR typed text
2. Uses AI to recognize handwriting → text (MyScript API)
3. Uses AI to extract structured data (OpenAI GPT-4o)
4. Presents formatted information
5. Offers to create a Booking or Estimate from the data

### User Flow

```
User writes/types note → Submit → AI Recognition → AI Parsing → Preview → Create Booking/Estimate
```

### Example Input (Raw Jotter Note)
```
John Smith
07712345678
Ford Focus 2018
YA19 ABC
Engine warning light, making knocking noise
Needs diagnostic
```

### Example Output (Structured JSON)
```json
{
  "customer_name": "John Smith",
  "phone": "07712345678",
  "vehicle": "Ford Focus",
  "year": "2018",
  "registration": "YA19 ABC",
  "issue": "Engine warning light, making knocking noise",
  "notes": "Needs diagnostic"
}
```

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        SMART JOTTER                             │
├─────────────────────────────────────────────────────────────────┤
│  INPUT LAYER                                                    │
│  ├─ Canvas (handwriting on tablet/phone)                        │
│  └─ Text box (typing option)                                    │
├─────────────────────────────────────────────────────────────────┤
│  HANDWRITING RECOGNITION (OCR/HTR)                              │
│  └─ MyScript API (free tier: 2,000/month)                       │
├─────────────────────────────────────────────────────────────────┤
│  AI PARSING (LLM)                                               │
│  └─ OpenAI GPT-4o structured output                             │
├─────────────────────────────────────────────────────────────────┤
│  OUTPUT                                                         │
│  ├─ Display formatted summary                                   │
│  └─ Buttons: "Create Booking" | "Create Estimate"               │
└─────────────────────────────────────────────────────────────────┘
```

### Page Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    /autow/jotter (New Page)                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────┐    ┌─────────────────┐                    │
│   │   TEXT MODE     │    │  HANDWRITE MODE │                    │
│   │   [Textarea]    │    │   [Canvas]      │                    │
│   └─────────────────┘    └─────────────────┘                    │
│                                                                  │
│                    [ SUBMIT BUTTON ]                             │
│                           │                                      │
│                           ▼                                      │
│              ┌────────────────────────┐                         │
│              │  If handwriting:       │                         │
│              │  MyScript API → Text   │                         │
│              └────────────────────────┘                         │
│                           │                                      │
│                           ▼                                      │
│              ┌────────────────────────┐                         │
│              │  OpenAI GPT-4o         │                         │
│              │  Extract structured    │                         │
│              │  data from text        │                         │
│              └────────────────────────┘                         │
│                           │                                      │
│                           ▼                                      │
│              ┌────────────────────────┐                         │
│              │  FORMATTED PREVIEW     │                         │
│              │  ─────────────────     │                         │
│              │  Customer: John Smith  │                         │
│              │  Phone: 07712345678    │                         │
│              │  Vehicle: Ford Focus   │                         │
│              │  Reg: YA19 ABC         │                         │
│              │  Issue: Engine warning │                         │
│              └────────────────────────┘                         │
│                                                                  │
│         [ CREATE BOOKING ]    [ CREATE ESTIMATE ]                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Two-Tier Orchestration

### Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  TIER 1: STRATEGIC ORCHESTRATOR (Claude Code CLI)              │
│  ─────────────────────────────────────────────────────────────  │
│  • High-level decisions                                         │
│  • Error resolution & guidance                                  │
│  • Code review & quality control                                │
│  • Unblock agents when stuck                                    │
│  • Human-in-the-loop escalation                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  TIER 2: TACTICAL COORDINATOR (MK1 - Automated)                │
│  ─────────────────────────────────────────────────────────────  │
│  • Runs every minute on Modal                                   │
│  • Assigns tasks based on dependencies                          │
│  • Tracks task completion                                       │
│  • Routes work to MK2/MK3/MK4/MK5                              │
│  • Updates project status                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  TIER 3: WORKER AGENTS (MK2, MK3, MK4, MK5)                    │
│  ─────────────────────────────────────────────────────────────  │
│  • Execute assigned tasks                                       │
│  • Report progress/errors                                       │
│  • Wait for dependencies                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Full Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                     CLAUDE CODE CLI                              │
│              Strategic Orchestrator + Watchdog                   │
│                                                                  │
│   • Create project & tasks                                       │
│   • Monitor agent_reports/ for issues                            │
│   • Write guidance when agents stuck                             │
│   • Final review & integration                                   │
└──────────────────────────────────────────────────────────────────┘
          │ Creates tasks              ▲ Reports errors
          ▼                            │
┌──────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                  │
│   projects | tasks | agent_status | agent_reports                │
└──────────────────────────────────────────────────────────────────┘
          │                            ▲
          ▼                            │
┌──────────────────────────────────────────────────────────────────┐
│                    MK1 COORDINATOR                               │
│                  (Runs every minute)                             │
│                                                                  │
│   • Check task dependencies                                      │
│   • Assign ready tasks to workers                                │
│   • Track completion                                             │
│   • Update project status                                        │
└──────────────────────────────────────────────────────────────────┘
          │ Assigns                    ▲ Reports
          ▼                            │
┌──────────┬──────────┬──────────┬──────────┐
│   MK2    │   MK3    │   MK4    │   MK5    │
│ Research │ Implement│ Testing  │   Docs   │
└──────────┴──────────┴──────────┴──────────┘
```

---

## Communication Protocol

### Agent Report Files (agent_reports/)

Agents write `.md` files when they need help or have updates:

```
agent_reports/
├── mk2_research_2026-01-05_143022_BLOCKED.md
├── mk3_implementation_2026-01-05_144511_ERROR.md
├── mk3_implementation_2026-01-05_150023_COMPLETE.md
└── mk4_testing_2026-01-05_151234_QUESTION.md
```

### Report Format

```markdown
# MK3 Implementation Report
**Status:** ERROR | BLOCKED | QUESTION | COMPLETE | PROGRESS
**Task:** Build jotter canvas component
**Timestamp:** 2026-01-05 14:45:11

## Summary
Failed to install react-signature-canvas - npm error

## Details
Error: ERESOLVE unable to resolve dependency tree
npm ERR! peer react@"^17.0.0" required

## What I Need
Guidance on React version compatibility or alternative library

## Files Created/Modified
- app/autow/jotter/page.tsx (partial)

## Next Steps (if unblocked)
Continue with canvas implementation
```

### Guidance Files (agent_guidance/)

Claude Code writes `.md` files to guide agents:

```
agent_guidance/
├── mk3_guidance_2026-01-05_145000.md
└── global_guidance.md
```

### Guidance Format

```markdown
# Guidance for MK3
**From:** Orchestrator (Claude Code)
**Timestamp:** 2026-01-05 14:50:00
**Re:** React version issue

## Solution
Use signature_pad instead of react-signature-canvas.
Install: npm install signature_pad
It has no React peer dependency.

## Code Example
```tsx
import SignaturePad from 'signature_pad';
// ... usage example
```

## Continue With
Proceed with implementation using this library.
```

---

## MK Agent Roles & Tasks

### MK1 - COORDINATOR

**Role:** Task orchestration and dependency management

| Responsibility | Details |
|----------------|---------|
| **Assign tasks** | Route tasks to appropriate agents |
| **Track dependencies** | Ensure MK2 completes before MK3 starts |
| **Monitor progress** | Update project status |
| **Escalate blockers** | Write to agent_reports/ if stuck |

**Tasks for Smart Jotter:**
1. Create project structure in database
2. Assign research tasks to MK2
3. Wait for MK2, then assign implementation to MK3
4. Coordinate testing and documentation phases

---

### MK2 - RESEARCH

**Role:** API research and technical specification

| Responsibility | Details |
|----------------|---------|
| **Research APIs** | MyScript, OpenAI structured output |
| **Find examples** | Working code samples |
| **Document findings** | Create technical spec |
| **Report blockers** | If API docs unclear, ask for help |

**Tasks:**

| Task ID | Name | Description | Dependencies | Output |
|---------|------|-------------|--------------|--------|
| 2.1 | Research MyScript | Find npm package, auth setup, React examples | None | research_myscript.md |
| 2.2 | Research OpenAI Parsing | JSON schema approach, prompt engineering | None | research_openai_parsing.md |
| 2.3 | Research Canvas Libraries | Compare signature_pad vs react-signature-canvas | None | research_canvas.md |
| 2.4 | Create Technical Spec | Combine research, define data structures | 2.1, 2.2, 2.3 | technical_spec.md |

---

### MK3 - IMPLEMENTATION

**Role:** Write the actual code

| Responsibility | Details |
|----------------|---------|
| **Build components** | React/Next.js pages and components |
| **Create API routes** | Backend endpoints |
| **Integrate APIs** | MyScript, OpenAI |
| **Report errors** | Write detailed error reports |

**Tasks:**

| Task ID | Name | Description | Dependencies | Output |
|---------|------|-------------|--------------|--------|
| 3.1 | Create Jotter Page | app/autow/jotter/page.tsx, add to nav | 2.4 | Files created |
| 3.2 | Text Input Mode | Textarea, submit, loading state | 3.1 | Text mode working |
| 3.3 | Canvas Mode | Touch support, clear/undo, export image | 3.1 | Canvas mode working |
| 3.4 | OCR API Route | POST /api/autow/jotter/recognize | 3.3 | API route created |
| 3.5 | Parsing API Route | POST /api/autow/jotter/parse | 3.2 | API route created |
| 3.6 | Preview Component | Display parsed data, edit capability | 3.4, 3.5 | Preview component |
| 3.7 | Integration | Create Booking/Estimate buttons | 3.6 | Full integration |

---

### MK4 - TESTING

**Role:** Quality assurance and testing

| Responsibility | Details |
|----------------|---------|
| **Write tests** | Unit and integration tests |
| **Manual testing** | Verify functionality |
| **Report bugs** | Document issues found |
| **Verify fixes** | Re-test after MK3 fixes |

**Tasks:**

| Task ID | Name | Description | Dependencies | Output |
|---------|------|-------------|--------------|--------|
| 4.1 | Test Text Flow | Various formats, edge cases | 3.7 | test_report_text.md |
| 4.2 | Test Canvas | Viewport sizes, touch vs mouse | 3.7 | test_report_canvas.md |
| 4.3 | Test APIs | OCR endpoint, parsing, errors | 3.7 | test_report_api.md |
| 4.4 | Test Integration | Full flow end-to-end | 4.1, 4.2, 4.3 | test_report_integration.md |

---

### MK5 - DOCUMENTATION

**Role:** User and developer documentation

| Responsibility | Details |
|----------------|---------|
| **User guide** | How to use Smart Jotter |
| **API docs** | Document new endpoints |
| **Update CLAUDE.md** | Add feature documentation |
| **Code comments** | Ensure code is documented |

**Tasks:**

| Task ID | Name | Description | Dependencies | Output |
|---------|------|-------------|--------------|--------|
| 5.1 | User Guide | How to use jotter feature | 4.4 | USER_GUIDE_JOTTER.md |
| 5.2 | API Documentation | Document new endpoints | 4.4 | API_DOCS_JOTTER.md |
| 5.3 | Update CLAUDE.md | Add Smart Jotter section | 5.1, 5.2 | CLAUDE.md updated |

---

## Watchdog Orchestrator Script

Save as `watchdog_orchestrator.py` in the project root:

```python
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
```

---

## Workflow Sequence

```
Phase 1: RESEARCH (MK2)
─────────────────────────────────────────────────
MK1 assigns research tasks to MK2
    │
    ▼
MK2 researches MyScript, OpenAI, Canvas libs
    │
    ├─── If BLOCKED ──▶ Writes report ──▶ Watchdog alerts Claude Code
    │                                            │
    │                   ◀── Claude writes guidance ◀───┘
    │
    ▼
MK2 completes research, writes technical_spec.md
    │
    ▼
MK1 marks research phase complete

Phase 2: IMPLEMENTATION (MK3)
─────────────────────────────────────────────────
MK1 assigns implementation tasks to MK3
    │
    ▼
MK3 reads technical_spec.md from MK2
    │
    ▼
MK3 builds components one by one
    │
    ├─── If ERROR ──▶ Writes detailed error report
    │                        │
    │   ◀── Claude analyzes and writes fix guidance ◀───┘
    │
    ▼
MK3 completes all implementation tasks

Phase 3: TESTING (MK4)
─────────────────────────────────────────────────
MK4 tests all functionality
    │
    ├─── If BUG FOUND ──▶ Reports to MK3 ──▶ MK3 fixes
    │
    ▼
MK4 approves all tests

Phase 4: DOCUMENTATION (MK5)
─────────────────────────────────────────────────
MK5 writes user guide and API docs
    │
    ▼
MK5 updates CLAUDE.md
    │
    ▼
PROJECT COMPLETE
```

---

## File Structure

### After Completion

```
D:\Projects-AI\autow-booking\
├── SMART_JOTTER_AGENTICOS_PLAN.md    # This file
├── watchdog_orchestrator.py           # Monitoring script
├── agent_status.json                  # Current status summary
│
├── agent_reports/                     # Agent status reports
│   ├── mk2_research_..._COMPLETE.md
│   ├── mk3_implementation_..._COMPLETE.md
│   ├── mk4_testing_..._COMPLETE.md
│   └── mk5_docs_..._COMPLETE.md
│
├── agent_guidance/                    # Orchestrator guidance
│   └── global_guidance.md
│
├── app/
│   └── autow/
│       └── jotter/                    # NEW FEATURE
│           └── page.tsx               # Smart Jotter page
│
├── app/api/autow/jotter/              # NEW API ROUTES
│   ├── recognize/route.ts             # OCR endpoint
│   └── parse/route.ts                 # AI parsing endpoint
│
└── docs/
    ├── USER_GUIDE_JOTTER.md           # User documentation
    └── API_DOCS_JOTTER.md             # API documentation
```

---

## Cost Estimate

### AgenticOS Deployment (Recommended)

| Component | Cost |
|-----------|------|
| MK2 Research (Claude Sonnet) | ~$1-2 |
| MK3 Implementation (Claude Sonnet) | ~$3-5 |
| MK4 Testing (Claude Sonnet) | ~$1-2 |
| MK5 Documentation (Claude Sonnet) | ~$0.50 |
| Claude Code Orchestration (Opus) | ~$5-10 |
| **Total** | **~$10-20** |

### Direct Claude Code Implementation (Not Recommended)

| Component | Cost |
|-----------|------|
| 10 hours Claude Opus | ~$50-150 |

### Runtime Costs (Monthly)

| Service | Free Tier | Beyond Free |
|---------|-----------|-------------|
| MyScript (handwriting) | 2,000/month | Contact |
| OpenAI GPT-4o (parsing) | - | ~$3-5/month |

---

## Deployment Steps

### Step 1: Create Watchdog Script

```bash
cd D:\Projects-AI\autow-booking
# Watchdog script will be created by Claude Code
```

### Step 2: Create Project in AgenticOS

```bash
cd D:\Projects-AI\Agentic\AgenticOSKevsAcademy-main
venv\Scripts\python.exe create_smart_jotter_project.py
```

### Step 3: Start Monitoring

```bash
# Terminal 1: Agent monitor
cd D:\Projects-AI\Agentic\AgenticOSKevsAcademy-main
venv\Scripts\python.exe mk_monitor.py

# Terminal 2: Watchdog orchestrator
cd D:\Projects-AI\autow-booking
python watchdog_orchestrator.py
```

### Step 4: Provide Guidance When Needed

When watchdog alerts:
1. Read the agent report in `agent_reports/`
2. Create guidance file in `agent_guidance/`
3. Agent will pick up guidance on next run

### Step 5: Final Review

When all tasks complete:
1. Review generated code
2. Test functionality
3. Deploy to Vercel

---

## API Keys Required

### MyScript (Handwriting Recognition)

- **Sign up:** https://developer.myscript.com
- **Free tier:** 2,000 requests/month
- **Add to .env.local:** `MYSCRIPT_API_KEY=xxx`

### OpenAI (Text Parsing)

- **Existing key or sign up:** https://platform.openai.com
- **Add to .env.local:** `OPENAI_API_KEY=xxx`

---

## References

- [MyScript Developer Portal](https://developer.myscript.com)
- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [signature_pad Library](https://www.npmjs.com/package/signature_pad)
- [react-signature-canvas](https://www.npmjs.com/package/react-signature-canvas)
- [AgenticOS Project](D:\Projects-AI\Agentic\AgenticOSKevsAcademy-main\CLAUDE.md)

---

## Notes

- MK agents run every minute on Modal
- Each agent checks for assigned tasks and executes
- Errors/blockers are reported via MD files
- Claude Code provides guidance when needed
- Project continues autonomously until complete

---

**Last Updated:** 2026-01-05
**Status:** Ready for deployment
