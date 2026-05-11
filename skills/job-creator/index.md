# Job Creator Execution

When this skill is triggered:

1. Convert the user's automation idea into a concrete Job definition.
2. Create `~/.agents/jobs/<job-name>/JOB.md`.
3. Use the repository template and spec for field names and structure.
4. If registration is requested:
   - Run `node cli/bin/jobs init` if `~/.agents/jobs.json` does not exist.
   - Run `node cli/bin/jobs add ~/.agents/jobs/<job-name>`.
   - Run `node cli/bin/jobs list` to confirm registration.
5. If registration is not requested, leave the global job file unregistered and report the exact `jobs add` command.

Do not modify `~/.claude/scheduled_tasks.json` directly. Let `jobs add`, `jobs remove`, `jobs enable`, `jobs disable`, or `jobs sync` perform synchronization.
