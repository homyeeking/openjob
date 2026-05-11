# Jobs Scheduler Execution

When this skill is triggered:

1. Read `~/.agents/jobs.json`
2. If file doesn't exist, tell the user to run `cjob init` first
3. Display all jobs in a formatted table:
   - Name, Cron, Enabled status, Last run, Run count
4. If user asks to sync:
   - Read `~/.claude/scheduled_tasks.json`
   - For each enabled job in registry, create/update the entry in Claude's tasks
   - For each disabled job, remove from Claude's tasks
   - Report sync results
5. If user asks to run a specific job:
   - Read the JOB.md file
   - Execute its instructions
