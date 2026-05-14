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

## References

- Template: `skills/job-creator/templates/JOB.md`
- Create the job file at `~/.agents/jobs/<job-name>/JOB.md`
- If `~/.agents/jobs.json` does not exist yet, run `npx openjob@latest init` first

## Workflow

1. Understand the automation request.
   - If the user gave enough intent, schedule, and execution scope, proceed.
   - Ask only when the schedule or side effects are truly ambiguous.
2. Choose a stable job name.
   - Use lowercase letters, numbers, and hyphens only.
   - Save to `~/.agents/jobs/<job-name>/JOB.md`.
3. Write `JOB.md` with YAML frontmatter plus Markdown instructions.
   - Refer to the template in `skills/job-creator/templates/JOB.md`.
   - Required frontmatter: `name`, `cron`, `description`.
   - Optional frontmatter: `condition`, `allowedSkills`, `timeout`, `retry`, `tags`.
4. If initialization is needed, run `npx openjob@latest init`.
5. Report the file path, schedule, and any known gaps.

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

Prefer `npx openjob@latest ...` for user-facing instructions and examples.
