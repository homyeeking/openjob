# Jobs

Jobs 是 **Out of loop** 的定时任务系统，让 AI 能够在 Agent Loop 之外持续、自动地执行任务。

## 核心概念

### In loop vs Out of loop

| 类型 | 触发方式 | 生命周期 | 自动化程度 |
|------|----------|----------|------------|
| **Skills** | Agent 决策 / 人工 `/slash` | 受限于当前 Agent Loop | 半自动化 |
| **Jobs** | Cron 定时 + 条件判断 | 系统级，Out of loop | **全自动化** |

### Jobs 解决的问题

- 想在睡眠时让 AI 继续消耗 token 帮你干活？
- 想让 AI 定时检查某些事情并自动执行？
- 想实现真正的自动化、自主进化？

**Jobs = Cron 定时任务 + 条件执行 + Skills 组合**

## 仓库结构

```
jobs/
├── README.md                 # 本文档
├── spec/
│   └── jobs-spec.md          # Jobs 规范定义
├── template/
│   └── JOB.md                # Job 模板
├── jobs/                     # 示例 Jobs
│   ├── npm-global-update/
│   ├── claude-news-collect/
│   └── todo-night-executor/
└── .claude-plugin/
    └── marketplace.json      # Claude Code 插件配置
```

## 快速开始

### 1. 创建一个 Job

在全局目录 `~/.agents/jobs/<job-name>/JOB.md` 创建 Job：

```markdown
---
name: my-first-job
cron: 0 9 * * *
description: 每天上午 9 点执行的示例任务
---

# 我的第一个 Job

在这里编写任务执行时的指令。
```

然后注册：

```bash
cjob init
cjob add ~/.agents/jobs/my-first-job
```

`cjob add` 会把 Job 写入全局注册表 `~/.agents/jobs.json`，可执行的 `JOB.md` 保存在 `~/.agents/jobs/<name>/JOB.md`，并同步启用的 Job 到 Claude scheduled tasks。

仓库里的 `jobs/` 目录是市场/源码模板。安装示例 Job 时会复制到全局 Jobs 目录：

```bash
cjob add jobs/todo-night-executor
```

### 2. 核心字段

| 字段 | 必填 | 说明 |
|------|------|------|
| `name` | 是 | Job 唯一标识（小写，连字符分隔） |
| `description` | 是 | Job 描述，说明何时使用 |
| `cron` | 是 | Cron 表达式，定义调度频率 |
| `condition` | 否 | 执行条件（脚本路径或条件描述） |
| `allowedSkills` | 否 | 允许使用的 Skills 列表 |

### 3. Cron 表达式

```
┌───────────── 分钟 (0-59)
│ ┌───────────── 小时 (0-23)
│ │ ┌───────────── 日期 (1-31)
│ │ │ ┌───────────── 月份 (1-12)
│ │ │ │ ┌───────────── 星期 (0-6，周日为0)
│ │ │ │ │
* * * * *
```

常用示例：
- `0 9 * * *` - 每天上午 9 点
- `0 9 * * 1` - 每周一上午 9 点
- `0 0 * * *` - 每天凌晨 0 点
- `*/30 * * * *` - 每 30 分钟

## 执行流程

```
┌──────────────┐
│   开始       │
└──────┬───────┘
       ▼
┌──────────────┐
│ 检查 Cron    │◄──────────────────┐
│ 是否到期?    │                   │
└──────┬───────┘                   │
       │                           │
   ┌───┴───┐                       │
   │ 否    │ 是                    │
   ▼       ▼                       │
┌──────┐ ┌──────────────┐         │
│等待  │ │检查 Condition │         │
└──┬───┘ └──────┬───────┘         │
   │            │                  │
   │        ┌───┴───┐              │
   │        │ 否    │ 是           │
   │        ▼       ▼              │
   │   ┌──────┐ ┌──────────────┐  │
   │   │等待  │ │ 执行 Job     │  │
   │   └──┬───┘ └──────┬───────┘  │
   │      │            │           │
   │      └────────────┼───────────┘
   │                   │
   └───────────────────┘
```

## 与 Skills 的关系

```
┌─────────────────────────────────────────┐
│                  Jobs                    │
│  ┌─────────────────────────────────┐    │
│  │  Cron 调度 + Condition 判断     │    │
│  │  (Out of loop)                  │    │
│  └──────────────┬──────────────────┘    │
│                 │                        │
│                 ▼                        │
│  ┌─────────────────────────────────┐    │
│  │         Skills 组合              │    │
│  │  (In loop / Agent loop)         │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

- **Jobs** 负责定时触发和条件判断（Out of loop）
- **Skills** 负责具体的任务执行（In loop）
- 一个 Job 可以组合多个 Skills 完成复杂任务

## 更多信息

- [规范文档](./spec/jobs-spec.md) - 完整的 Jobs 规范定义
- [模板](./template/JOB.md) - 创建新 Job 的模板
- [示例 Jobs](./jobs/) - 查看更多示例

## 相关

- [Jobs Over Skills](https://homyzone.pages.dev/blogs/aigc/jobs-over-skills)

核心观点：**定时任务是实现自动化、自主进化的一个重要方式。**
