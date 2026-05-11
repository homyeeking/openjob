# Job Creator Execution

When this skill is triggered:

1. Convert the user's automation idea into a concrete Job definition.
2. Create `~/.agents/jobs/<job-name>/JOB.md`.
3. Use the repository template and spec for field names and structure.
4. If registration is requested:
   - Run `node bin/cjob init` if `~/.agents/jobs.json` does not exist.
   - Run `node bin/cjob add ~/.agents/jobs/<job-name>`.
   - Run `node bin/cjob list` to confirm registration.
5. If registration is not requested, leave the global job file unregistered and report the exact `cjob add` command.

Do not modify `~/.claude/scheduled_tasks.json` directly. Let `cjob add`, `cjob remove`, `cjob enable`, `cjob disable`, or `cjob sync` perform synchronization.
