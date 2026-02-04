# Development Documentation Structure

This directory replaces JIRA/project management tools with markdown-based task tracking.

## Hierarchy

```
docs/development/
├── README.md                          # MVP Roadmap (this is your "dashboard")
├── STRUCTURE.md                       # This file
│
├── 01-pdf-viewer-annotation/          # Epic 1
│   ├── README.md                      # Epic overview
│   ├── phase-1-text-layer/            # ✅ Complete
│   ├── phase-2-highlight-rendering/   # ✅ Complete
│   ├── phase-3-selection-capture/     # ✅ Complete
│   ├── phase-4-highlight-management/  # ✅ Complete (directory with sub-tasks)
│   ├── phase-5-backend-integration/   # ⚪ Not Started (directory with sub-tasks)
│   ├── phase-6-context-system/        # ⚪ Not Started
│   └── phase-7-page-numbering/        # ⚪ Not Started
│
├── 02-concept-detection/              # Epic 2
│   ├── README.md
│   ├── task-1-text-extraction.md     # Placeholder
│   ├── task-2-llm-integration.md     # Placeholder
│   ├── task-3-concept-clustering.md  # Placeholder
│   └── task-4-entry-suggestion.md    # Placeholder
│
├── 03-index-editor/                   # Epic 3
│   ├── README.md
│   ├── task-1-tree-view.md           # Placeholder
│   ├── task-2-entry-crud.md          # Placeholder
│   ├── task-3-hierarchy-management.md # Placeholder
│   └── task-4-search-filter.md       # Placeholder
│
├── 04-export-publishing/              # Epic 4
│   ├── README.md
│   ├── task-1-format-engine.md       # Placeholder
│   ├── task-2-multi-format.md        # Placeholder
│   └── task-3-print-ready.md         # Placeholder
│
└── 05-infrastructure/                 # Epic 5
    ├── README.md
    ├── task-3-document-upload.md     # Placeholder (in progress)
    └── task-4-schema-finalization.md # Placeholder
```

## File Naming Conventions

**Epics (directories):**
- Format: `{number}-{kebab-case-name}/`
- Example: `01-pdf-viewer-annotation/`
- Number indicates priority/sequence

**Tasks (markdown files):**
- Format: `phase-{number}-{kebab-case-name}.md` (for sequential work)
- Format: `task-{number}-{kebab-case-name}.md` (for parallel work)
- Example: `phase-4-highlight-management.md`
- Example: `task-2-llm-integration.md`

**Epic README:**
- Always `README.md` in epic directory
- Contains epic overview, task list, dependencies, success criteria

## Status Indicators

Use emoji in docs for quick visual scanning:

- ✅ Complete
- 🟢 Partially Complete
- 🟡 In Progress
- ⚪ Not Started
- 🔴 Blocked
- ⏸️  Paused

## Task Document Template

```markdown
# Phase/Task N: Feature Name

**Status:** ⚪ Not Started  
**Dependencies:** Phase X, Epic Y  
**Duration:** N days

## Overview

Brief description of what this accomplishes.

## Requirements

- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

## Technical Approach

How we'll implement this.

## Deliverables

- [ ] Deliverable 1
- [ ] Deliverable 2

## Testing Requirements

- [ ] Test case 1
- [ ] Test case 2

## Success Criteria

What "done" looks like.

## Next Phase

What comes after this.
```

## How to Use This System

**Starting a new epic:**
1. Create directory: `0N-epic-name/`
2. Create `README.md` with epic overview
3. Create placeholder task files
4. Update main `README.md` with epic status

**Working on a task:**
1. Update task status to 🟡 In Progress
2. Fill in implementation details
3. Check off requirements as completed
4. Update task status to ✅ Complete when done
5. Update epic README.md with completion

**Planning next work:**
1. Review main `README.md` for current sprint
2. Look at epic dependencies
3. Choose next task based on critical path
4. Detail out task requirements before starting

**Tracking overall progress:**
- Main `README.md` is your dashboard
- Epic READMEs show detailed progress
- Task files are the JIRA tickets

## Benefits Over JIRA

✅ **Version controlled** - All in git  
✅ **Context preserved** - Technical details stay with tasks  
✅ **Searchable** - grep, IDE search, GitHub search  
✅ **Fast** - No web UI loading  
✅ **Markdown** - Code blocks, links, formatting  
✅ **Offline** - No internet required  
✅ **Free** - No JIRA license needed

## Cross-Referencing

Use relative links to reference related docs:

```markdown
See [Phase 3](./phase-3-selection-capture/)
See [Epic 2](../02-concept-detection/README.md)
See [Architecture](../../architecture/component-architecture.md)
```

## Integration with Plans

Some detailed planning still lives in `~/.cursor/plans/`:
- These are implementation-level details
- Development docs reference the plans
- Plans can be archived after implementation
- Development docs remain as historical record
