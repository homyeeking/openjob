---
name: jobs-scheduler
description: Manage and sync scheduled jobs from the global ~/.agents/jobs.json registry
triggers:
  - /jobs
  - "jobs list"
  - "jobs sync"
  - "show jobs"
---

# Jobs Scheduler

Read and manage the global jobs registry at `~/.agents/jobs.json`.

## Usage

When triggered, read `~/.agents/jobs.json` and:
1. List all registered jobs with their cron schedules and status
2. If the user asks to sync, write enabled jobs to the agent platform's scheduled tasks
3. Report any jobs that need attention (disabled, failing)
