---
name: todo-night-executor
cron: 0 0 * * *
description: Automatically execute TODO tasks from project TODO list every midnight
condition: Check if there are unfinished TODO items in current directory
tags: [automation, development, todo]
timeout: 360
retry: 1
---

# Nightly TODO Executor

## Objective

Automatically discover and execute TODO items in the project during user's sleep time, enabling an automated development experience: "Record TODO before sleep, see results when waking up".

## Execution Steps

### Phase 1: Discover TODOs

1. Scan current working directory for TODOs in these forms:
   - `TODO.md` file
   - TODO section in `README.md`
   - Code comments like `// TODO:` or `/* TODO */`
   - Project management files (e.g., `tasks.md`, `backlog.md`, etc.)

2. Parse and extract TODO items including:
   - Task description
   - Priority markers (e.g., `[P0]`, `[high]`, `!`, etc.)
   - Estimated complexity
   - Dependencies

### Phase 2: Task Evaluation

Evaluate each extracted TODO:

| Type | Suggested Action |
|------|------------------|
| Simple bug fix | Execute automatically |
| Documentation writing | Execute automatically |
| Code refactoring | Decide after evaluating complexity |
| New feature development | Record questions when requirements need clarification |
| Decision-required questions | Record and wait for user confirmation |

### Phase 3: Task Execution

Execute tasks in priority order:

1. **High priority (P0) tasks**: Execute first
2. **Medium priority (P1) tasks**: Execute if time permits
3. **Low priority (P2) tasks**: Execute only after high/medium priority tasks complete

Execution requirements:
- Record current state before each task starts
- Keep detailed logs during execution
- Record results and changes after completion
- When encountering uncertainties, record questions and skip

### Phase 4: Result Summary

After execution completes, generate an execution report:

```markdown
## Nightly Execution Report - YYYY-MM-DD

### Completed Tasks
- [x] Task 1 - Completion time/change summary
- [x] Task 2 - Completion time/change summary

### Partially Complete / Issues Encountered
- [ ] Task 3 - Specific problems encountered / points needing user decision

### Skipped Tasks
- Task 4 - Reason for skipping (e.g., unclear requirements)

### Suggestions
- Task 5 - Needs user to provide additional information before execution
```

## Execution Principles

### Safety First

1. **Stop when in doubt**: When encountering uncertain situations, don't guess, record and wait for user confirmation
2. **Caution with destructive operations**: Operations involving deletion, large-scale refactoring, etc., mark as requiring user confirmation
3. **Preserve rollback capability**: All changes should have git commits for easy rollback

### Quality Assurance

1. Completed code should follow existing project style
2. Projects with tests should ensure tests pass
3. Documentation changes should be clear and accurate

### Time Management

1. Total execution time should not exceed `timeout` setting
2. Consider splitting individual tasks that take too long
3. Prioritize completing high-priority tasks

## Marker Convention

Use these markers when processing TODOs:

| Marker | Meaning |
|--------|---------|
| `// TODO:` | Pending execution |
| `// IN-PROGRESS:` | In execution |
| `// DONE:` | Completed (can delete comment) |
| `// BLOCKED:` | Blocked, needs user intervention |

## Example Scenario

**User Action** (during day):
```markdown
## TODO
- [ ] Fix user login API bug (logs show null pointer)
- [ ] Write documentation for new API
- [ ] Consider whether to refactor auth module
```

**AI Execution** (at night):
1. Fix login API bug → completed, code committed
2. Write API documentation → completed, docs updated
3. Refactor auth module → marked as needing user confirmation, analysis results recorded

**User Wakes Up**:
- Sees fixed bug and new documentation
- Sees analysis and suggestions about refactoring, can make decision directly
