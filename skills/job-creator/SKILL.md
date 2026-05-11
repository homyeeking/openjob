---
name: job-creator
description: Create a global scheduled Job by turning a user automation request into ~/.agents/jobs/<name>/JOB.md and optionally registering it with the jobs CLI.
triggers:
  - "create job"
  - "new job"
  - "job creator"
  - "generate JOB.md"
  - "job create"
---

# Job Creator

Create a schedulable global Job that matches the repository Jobs specification and the current `jobs` CLI.

## Workflow

1. Understand the automation request.
   - If the user gave enough intent, schedule, and execution scope, proceed.
   - Ask only when the schedule or side effects are truly ambiguous.
2. Choose a stable job name.
   - Use lowercase letters, numbers, and hyphens only.
   - Save to `~/.agents/jobs/<job-name>/JOB.md`.
3. Write `JOB.md` with YAML frontmatter plus Markdown instructions.
   - Required frontmatter: `name`, `cron`, `description`.
   - Optional frontmatter: `condition`, `allowedSkills`, `timeout`, `retry`, `tags`.
4. Validate through the CLI path whenever possible.
   - Run `node cli/bin/jobs add ~/.agents/jobs/<job-name>` only if the user wants the job registered now.
   - If `~/.agents/jobs.json` is missing and registration is requested, run `node cli/bin/jobs init` first.
   - `jobs add` is the source of truth for parsing and cron validation.
5. Report the file path, schedule, registration status, and any known gaps.

## Field Guidance

- `description`: One sentence describing what runs and when it is useful.
- `cron`: Use standard 5-field cron. Prefer simple schedules.
- `condition`: Add when the job should skip unless a concrete state is present.
- `allowedSkills`: Restrict to the skills the job actually needs. Omit it when broad tool use is expected.
- `timeout`: Default to `60`; increase for repo-wide implementation jobs or slow external work.
- `retry`: Default to `0`; use `1` for transient network/API work.
- `tags`: Use 1-4 short tags for browsing and filtering.

Common cron values:

| Intent | Cron |
| --- | --- |
| Daily at 9 AM | `0 9 * * *` |
| Daily at midnight | `0 0 * * *` |
| Every Monday at 9 AM | `0 9 * * 1` |
| Every 30 minutes | `*/30 * * * *` |
| Every 6 hours | `0 */6 * * *` |
| Monthly on the 1st at 9 AM | `0 9 1 * *` |

## JOB.md Shape

Use this structure unless the task needs a stronger custom shape:

```markdown
---
name: example-job
cron: 0 9 * * *
description: Check project state every morning and report actionable follow-ups.
condition: Check whether there is new project state to review.
allowedSkills: [jobs-scheduler]
timeout: 60
retry: 0
tags: [automation]
---

# Example Job

## Objective

Describe the outcome the agent should produce.

## Execution Steps

1. Inspect the current state relevant to the condition.
2. Execute the requested automation.
3. Verify the result before reporting completion.

## Output Requirements

Report what changed, what was verified, and any blockers.

## Notes

Keep side effects scoped to the task described in this job.
```

## CLI Alignment

The current `jobs` CLI supports:

- `jobs init`: create `~/.agents/jobs.json` and `~/.agents/jobs/`.
- `jobs add <path>`: parse `JOB.md`, copy it to `~/.agents/jobs/<name>/JOB.md`, register the job globally, and sync enabled jobs to Claude scheduled tasks.
- `jobs list`: display registered jobs.
- `jobs run <name>`: print the prompt for manual execution.
- `jobs enable|disable|remove <name>`: update registry state and sync.
- `jobs sync`: sync enabled registry entries to Claude scheduled tasks.

Prefer `node cli/bin/jobs ...` inside this repository unless `jobs` is known to be installed globally.
