# Jobs Specification

This document defines the standard format and execution specification for Jobs.

## Version

Current version: 1.0.0

## Overview

A Job is a file containing YAML frontmatter and Markdown content that defines a schedulable task.

## File Structure

Each Job must be in its own folder (named after the `name` field), containing a `JOB.md` file:

```
my-job/
└── JOB.md
```

Optional additional files/folders:
- `scripts/` - Helper scripts
- `assets/` - Resource files
- `references/` - Reference documents

## JOB.md Format

### Frontmatter

Frontmatter is in YAML format, wrapped with `---` at the top of the file:

```markdown
---
name: job-name
cron: 0 9 * * *
description: Description of the job
condition: ./scripts/check-condition.sh
allowedSkills: [skill-1, skill-2]
---
```

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique identifier for the job. Lowercase letters, numbers, and hyphens only. |
| `description` | string | Yes | Complete description of what the job does, when to use it, and why. |
| `cron` | string | Yes | Cron expression defining the schedule frequency. |
| `condition` | string | No | Execution condition. Can be a script path (returns boolean) or natural language description. |
| `allowedSkills` | array | No | List of Skills allowed for this job. All Skills are allowed if not specified. |
| `timeout` | number | No | Execution timeout in minutes. Default: 60 minutes. |
| `retry` | number | No | Number of retries on failure. Default: 0 (no retries). |
| `tags` | array | No | List of tags for categorization and filtering. |

### Cron Expression

Standard 5-field Cron format:

```
┌───────────── Minute (0-59)
│ ┌───────────── Hour (0-23)
│ │ ┌───────────── Day of month (1-31)
│ │ │ ┌───────────── Month (1-12)
│ │ │ │ ┌───────────── Day of week (0-6, Sunday is 0)
│ │ │ │ │
* * * * *
```

Special characters:
- `*` - Match any value
- `,` - Separate multiple values (e.g., `1,15,30`)
- `-` - Range (e.g., `1-5` for Monday through Friday)
- `/` - Step (e.g., `*/30` for every 30)

Common examples:

| Cron | Description |
|------|-------------|
| `0 9 * * *` | Every day at 9:00 AM |
| `0 9 * * 1` | Every Monday at 9:00 AM |
| `0 0 * * *` | Every day at midnight |
| `0 0 * * 0` | Every Sunday at midnight |
| `*/30 * * * *` | Every 30 minutes |
| `0 */6 * * *` | Every 6 hours |
| `0 9 1 * *` | 1st of every month at 9:00 AM |

### Condition

The `condition` field supports two forms:

#### 1. Script Path

```yaml
condition: ./scripts/is-claude-updated.sh
```

Script requirements:
- Executable permission
- Exit code `0` = condition met (execute Job)
- Exit code `1` = condition not met (skip)
- stdout can output a brief reason

#### 2. Natural Language Description

```yaml
condition: Check if there are new TODO items in ./TODO.md
```

In this case, the AI will evaluate whether the condition is met based on the description.

### Markdown Content

After the frontmatter is the instruction content in Markdown format. This content is loaded into the AI's context when the Job triggers.

Recommended structure:

```markdown
# Job Name

## Objective
[Describe what this job should accomplish]

## Execution Steps
1. [Step 1]
2. [Step 2]
...

## Output Requirements
[Expected output format or results]

## Notes
[Important details to consider]
```

## Execution Flow

### 1. Schedule Check

The scheduler wakes up according to the cron expression and checks:
- If current time matches the cron expression
- If the previous execution completed successfully

### 2. Condition Evaluation

If `condition` is defined:
- Execute the condition script or have AI evaluate it
- Continue if condition met, otherwise wait for next cycle

### 3. Load Context

Preparation before execution:
- Load Skills specified in `allowedSkills`
- Load the Job's own Markdown instructions
- Prepare execution environment

### 4. Execute Task

AI executes the task based on instructions:
- Can call allowed Skills
- Can use tools (file read/write, command execution, etc.)
- Record execution process and results

### 5. Result Feedback

After execution completes:
- Record execution status (success/failure)
- Record output and logs
- Decide whether to retry based on `retry` configuration

## State Persistence

Recommended to record each Job's execution state:

```json
{
  "jobName": "my-job",
  "lastRun": "2026-04-28T09:00:00Z",
  "lastStatus": "success",
  "consecutiveFailures": 0,
  "totalRuns": 42
}
```

## Error Handling

### Timeout

- Force terminate after `timeout` duration
- Record timeout status
- Decide whether to retry based on `retry`

### Failure

- Record error information
- Retry with exponential backoff when `retry > 0`
- Consider disabling Job after reaching consecutive failure threshold

## Best Practices

### 1. Job Granularity

- Each Job should have a single, clear objective
- Complex tasks can be split into multiple Jobs coordinated through dependencies
- Avoid long execution times (recommended: < 30 minutes)

### 2. Idempotency

- Job should be idempotent: multiple executions produce the same result
- Track processed items to avoid duplicate processing

### 3. Observability

- Require clear log output in instructions
- Record key decision points
- Output structured results (JSON, etc.) for post-processing

### 4. Security

- Inject sensitive information through environment variables, don't hardcode
- Verify source before script execution
- Limit Job's permission scope

## Examples

See the [example Jobs](../jobs/) directory for complete examples.
