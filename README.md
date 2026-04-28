# Jobs

Jobs is an **Out of loop** scheduled task system that enables AI to execute tasks continuously and automatically outside the Agent Loop.

[中文版本](./README.zh.md)

## Core Concepts

### In loop vs Out of loop

| Type | Trigger | Lifecycle | Automation |
|------|---------|-----------|------------|
| **Skills** | Agent decision / Manual `/slash` | Bound to current Agent Loop | Semi-automated |
| **Jobs** | Cron schedule + Condition check | System-level, Out of loop | **Fully automated** |

### Problems Jobs Solve

- Want AI to keep consuming tokens and working for you while you sleep?
- Want AI to periodically check things and execute automatically?
- Want to achieve true automation and autonomous evolution?

**Jobs = Cron Scheduled Tasks + Conditional Execution + Skills Composition**

## Repository Structure

```
jobs/
├── README.md                 # This document
├── README.zh.md              # Chinese version
├── spec/
│   └── jobs-spec.md          # Jobs specification
├── template/
│   └── JOB.md                # Job template
├── jobs/                     # Example Jobs
│   ├── npm-global-update/
│   ├── claude-news-collect/
│   └── todo-night-executor/
└── .claude-plugin/
    └── marketplace.json      # Claude Code plugin configuration
```

## Quick Start

### 1. Create a Job

Create a folder under `jobs/` containing a `JOB.md` file:

```markdown
---
name: my-first-job
cron: 0 9 * * *
description: Example job that runs daily at 9 AM
---

# My First Job

Write your instructions here that Claude will follow when this job triggers.
```

### 2. Core Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique identifier for the job (lowercase, hyphen-separated) |
| `description` | Yes | Description of what the job does and when to use it |
| `cron` | Yes | Cron expression defining the schedule |
| `condition` | No | Execution condition (script path or natural language) |
| `allowedSkills` | No | List of Skills allowed for this job |

### 3. Cron Expression

```
┌───────────── Minute (0-59)
│ ┌───────────── Hour (0-23)
│ │ ┌───────────── Day of month (1-31)
│ │ │ ┌───────────── Month (1-12)
│ │ │ │ ┌───────────── Day of week (0-6, Sunday is 0)
│ │ │ │ │
* * * * *
```

Common examples:
- `0 9 * * *` - Every day at 9 AM
- `0 9 * * 1` - Every Monday at 9 AM
- `0 0 * * *` - Every day at midnight
- `*/30 * * * *` - Every 30 minutes

## Execution Flow

```
┌──────────────┐
│    Start     │
└──────┬───────┘
       ▼
┌──────────────┐
│ Check Cron   │◄──────────────────┐
│  Is due?     │                   │
└──────┬───────┘                   │
       │                           │
   ┌───┴───┐                       │
   │  No   │ Yes                   │
   ▼       ▼                       │
┌──────┐ ┌──────────────┐         │
│Wait  │ │Check Condition│         │
└──┬───┘ └──────┬───────┘         │
   │            │                  │
   │        ┌───┴───┐              │
   │        │  No   │ Yes           │
   │        ▼       ▼              │
   │   ┌──────┐ ┌──────────────┐  │
   │   │Wait  │ │ Execute Job  │  │
   │   └──┬───┘ └──────┬───────┘  │
   │      │            │           │
   │      └────────────┼───────────┘
   │                   │
   └───────────────────┘
```

## Relationship with Skills

```
┌─────────────────────────────────────────┐
│                  Jobs                    │
│  ┌─────────────────────────────────┐    │
│  │  Cron Scheduling + Condition    │    │
│  │  Checking (Out of loop)         │    │
│  └──────────────┬──────────────────┘    │
│                 │                        │
│                 ▼                        │
│  ┌─────────────────────────────────┐    │
│  │         Skills Composition      │    │
│  │  (In loop / Agent loop)         │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

- **Jobs** handle scheduling and condition checking (Out of loop)
- **Skills** handle actual task execution (In loop)
- One Job can compose multiple Skills to complete complex tasks

## More Information

- [Specification](./spec/jobs-spec.md) - Complete Jobs specification
- [Template](./template/JOB.md) - Template for creating new Jobs
- [Example Jobs](./jobs/) - View more examples

## Related

- [Jobs Over Skills](https://homyzone.pages.dev/blogs/aigc/jobs-over-skills)

Core insight: **Scheduled tasks are an important way to achieve automation and autonomous evolution.**
