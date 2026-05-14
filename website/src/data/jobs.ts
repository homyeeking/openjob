export interface Job {
  rank: number;
  name: string;
  desc: string;
  fullDesc: string;
  tags: string[];
  cron: string;
  cronLabel: string;
  timeout: number;
  retry: number;
  installs: string;
  category: 'automation' | 'monitoring' | 'maintenance';
  allowedSkills: string[];
  condition: string;
  steps: string[];
  body: string;
}

export const jobs: Job[] = [
  {
    rank: 1,
    name: 'todo-night-executor',
    desc: "Automatically discover and execute TODO items in the project during user's sleep time. \"Record TODO before sleep, see results when waking up.\"",
    fullDesc: "Scans your project for TODO items in code comments, TODO.md files, and README sections. Evaluates complexity and priority, then executes tasks autonomously overnight. Generates a morning execution report with completed tasks, blockers, and suggestions.",
    tags: ['automation', 'development', 'todo'],
    cron: '0 0 * * *',
    cronLabel: 'Daily at midnight',
    timeout: 360,
    retry: 1,
    installs: '12.4K',
    category: 'automation',
    allowedSkills: ['commit-push'],
    condition: 'Check if there are unfinished TODO items in current directory',
    steps: ['Discover TODOs (code comments, TODO.md, README)', 'Evaluate priority and complexity', 'Execute high-priority tasks first', 'Generate execution report'],
    body: `# Nightly TODO Executor

## Objective

Automatically discover and execute TODO items in the project during user's sleep time, enabling an automated development experience: "Record TODO before sleep, see results when waking up".

## Execution Steps

### Phase 1: Discover TODOs

1. Scan current working directory for TODOs in these forms:
   - \`TODO.md\` file
   - TODO section in \`README.md\`
   - Code comments like \`// TODO:\` or \`/* TODO */\`
   - Project management files (e.g., \`tasks.md\`, \`backlog.md\`, etc.)

2. Parse and extract TODO items including:
   - Task description
   - Priority markers (e.g., \`[P0]\`, \`[high]\`, \`!\`, etc.)
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

### Phase 4: Result Summary

After execution completes, generate an execution report:

- Completed tasks with change summaries
- Partially complete / issues encountered
- Skipped tasks with reasons
- Suggestions for user review

## Execution Principles

### Safety First

1. **Stop when in doubt**: When encountering uncertain situations, don't guess, record and wait for user confirmation
2. **Caution with destructive operations**: Operations involving deletion, large-scale refactoring, etc., mark as requiring user confirmation
3. **Preserve rollback capability**: All changes should have git commits for easy rollback

### Quality Assurance

1. Completed code should follow existing project style
2. Projects with tests should ensure tests pass
3. Documentation changes should be clear and accurate`
  },
  {
    rank: 2,
    name: 'claude-news-collect',
    desc: 'Collect Claude-related official updates daily. If there is new content, summarize and publish to personal blog automatically.',
    fullDesc: "Monitors Anthropic's official blog, documentation changelogs, and GitHub releases for new Claude-related content. When updates are found, generates a structured summary article covering new features, improvements, and breaking changes, then publishes to your blog.",
    tags: ['monitoring', 'claude', 'blog'],
    cron: '0 10 * * *',
    cronLabel: 'Daily at 10 AM',
    timeout: 60,
    retry: 0,
    installs: '8.7K',
    category: 'monitoring',
    allowedSkills: ['write-to-blog'],
    condition: 'Check if there are new updates from Claude official channels',
    steps: ['Check Anthropic blog, docs, and GitHub releases', 'Filter for genuinely new content', 'Write structured summary article', 'Publish to blog'],
    body: `# Claude Update Collector

## Objective

Check Claude-related official updates daily. If there is new content, summarize and publish to personal blog.

## Execution Steps

### Phase 1: Information Collection

Check the following sources for new content:

1. **Anthropic Official Blog**
   - https://www.anthropic.com/news
   - Look for new articles within the last 24 hours

2. **Claude Documentation Updates**
   - https://docs.anthropic.com
   - Check changelogs, release notes

3. **GitHub Releases**
   - Updates to related SDKs and tools

### Phase 2: Content Summary

If new content is found:

1. Read and understand the updates
2. Extract key points:
   - New features
   - Important improvements
   - Breaking changes
   - New APIs or parameters

3. Write a structured summary article including:
   - Update overview
   - Detailed explanation of core changes
   - Practical application scenarios
   - Migration recommendations (if there are breaking changes)

### Phase 3: Publish

Use \`write-to-blog\` skill to publish the summary article to personal blog.

## Output Requirements

- If updates exist: publish a blog article
- If no updates: record "No updates today" and exit
- All execution situations should be logged`
  },
  {
    rank: 3,
    name: 'environment-global-update',
    desc: 'Automatically update installed npm global packages, Homebrew packages, and global skills every Monday to keep the development environment up to date.',
    fullDesc: 'Keeps your npm globals, Homebrew dependencies, and global skills current by running weekly non-interactive updates. Records version and outdated lists before and after, flags major version bumps separately, and handles errors gracefully without affecting subsequent updates.',
    tags: ['maintenance', 'npm', 'homebrew', 'skills'],
    cron: '0 9 * * 1',
    cronLabel: 'Every Monday 9 AM',
    timeout: 30,
    retry: 0,
    installs: '5.2K',
    category: 'maintenance',
    allowedSkills: [],
    condition: '',
    steps: ['List current global packages', 'Execute npm update -g', 'Upgrade Homebrew packages', 'Update global skills'],
    body: `# Environment Global Dependencies Update

## Objective

Automatically update installed npm global packages, Homebrew packages, and global skills every Monday to keep the development environment up to date. All commands must run in non-interactive mode.

## Execution Steps

1. Check current npm global installation list
   \`\`\`bash
   npm list -g --depth=0
   \`\`\`

2. Execute npm global update in non-interactive mode
   \`\`\`bash
   npm update -g
   \`\`\`

3. Check current Homebrew package status
   \`\`\`bash
   brew outdated
   \`\`\`

4. Update Homebrew formulae metadata in non-interactive mode
   \`\`\`bash
   HOMEBREW_NO_ENV_HINTS=1 brew update --quiet
   \`\`\`

5. Upgrade all outdated Homebrew dependencies in non-interactive mode
   \`\`\`bash
   HOMEBREW_NO_ENV_HINTS=1 brew upgrade
   \`\`\`

6. Update global skills in non-interactive mode
   \`\`\`bash
   npx skills@latest update -y -g
   \`\`\`

7. Verify update results
   - Run \`npm list -g --depth=0\` again for comparison
   - Run \`brew outdated\` again to verify no pending upgrades remain
   - Optionally run \`npm list -g --depth=0 | grep skills\` or equivalent if verification is needed
   - Check for any errors

## Output Requirements

Record the following information:
- Version list before update
- Version list after update
- Homebrew outdated list before update
- Homebrew outdated list after update
- Global skills update result
- Any warnings or error messages

## Notes

- If certain packages need to stay at specific versions, check and skip them first
- Record specific errors when update fails, don't affect subsequent execution
- If there are major version bumps, mark and record them separately
- All commands should avoid interactive prompts; prefer explicit non-interactive flags or environment variables when available`
  },
  {
    rank: 4,
    name: 'security-audit-weekly',
    desc: 'Run npm audit and dependency vulnerability checks every week. Generate a report and flag critical issues for immediate review.',
    fullDesc: 'Performs comprehensive security audits on your project dependencies. Checks for known vulnerabilities, outdated packages with security patches, and generates prioritized reports. Critical issues are flagged for immediate developer attention.',
    tags: ['security', 'audit', 'npm'],
    cron: '0 8 * * 1',
    cronLabel: 'Every Monday 8 AM',
    timeout: 45,
    retry: 1,
    installs: '3.8K',
    category: 'maintenance',
    allowedSkills: [],
    condition: '',
    steps: ['Run npm audit', 'Check for outdated dependencies', 'Analyze vulnerability severity', 'Generate prioritized report'],
    body: `# Security Audit Weekly

## Objective

Run npm audit and dependency vulnerability checks every week. Generate a report and flag critical issues for immediate review.

## Execution Steps

1. Run \`npm audit\` to check for known vulnerabilities
2. Check for outdated dependencies with \`npm outdated\`
3. Analyze severity levels (critical, high, moderate, low)
4. Generate a prioritized security report

## Output Requirements

- List of vulnerabilities sorted by severity
- Recommended actions for each issue
- Summary of overall project security health`
  },
  {
    rank: 5,
    name: 'pr-review-notifier',
    desc: 'Monitor open pull requests across repositories. Notify the team when PRs are stale for more than 48 hours or need review.',
    fullDesc: 'Tracks open pull requests across your repositories and identifies stale reviews. Sends notifications when PRs have been waiting for review for more than 48 hours, helping teams maintain healthy review cycles and avoid blocked development.',
    tags: ['monitoring', 'github', 'notifications'],
    cron: '0 9,17 * * 1-5',
    cronLabel: 'Weekdays 9 AM & 5 PM',
    timeout: 20,
    retry: 0,
    installs: '2.9K',
    category: 'monitoring',
    allowedSkills: [],
    condition: '',
    steps: ['Fetch open PRs from GitHub API', 'Calculate time since last review', 'Identify stale PRs (>48h)', 'Send notification summary'],
    body: `# PR Review Notifier

## Objective

Monitor open pull requests across repositories. Notify the team when PRs are stale for more than 48 hours or need review.

## Execution Steps

1. Fetch open PRs from GitHub API
2. Calculate time since last review activity
3. Identify stale PRs (>48 hours without review)
4. Send notification summary to team

## Output Requirements

- List of stale PRs with age and author
- Recommended reviewers based on code ownership
- Summary of review queue health`
  },
  {
    rank: 6,
    name: 'ci-health-check',
    desc: 'Check CI/CD pipeline health across all repos. Alert on consecutive failures and auto-create issues for broken main branches.',
    fullDesc: 'Monitors CI/CD pipeline status across all connected repositories. Detects consecutive failures, broken main branches, and flaky tests. Automatically creates GitHub issues for persistent failures and sends alerts to the responsible team.',
    tags: ['monitoring', 'ci', 'devops'],
    cron: '*/30 * * * *',
    cronLabel: 'Every 30 minutes',
    timeout: 15,
    retry: 2,
    installs: '2.1K',
    category: 'monitoring',
    allowedSkills: [],
    condition: '',
    steps: ['Check CI status for all repos', 'Detect consecutive failures', 'Auto-create issues for broken main', 'Send alert notifications'],
    body: `# CI Health Check

## Objective

Check CI/CD pipeline health across all repos. Alert on consecutive failures and auto-create issues for broken main branches.

## Execution Steps

1. Check CI status for all connected repositories
2. Detect consecutive failures on main branch
3. Auto-create GitHub issues for persistent failures
4. Send alert notifications to responsible team

## Output Requirements

- Status dashboard for all pipelines
- List of failing pipelines with failure count
- Auto-created issue links`
  },
  {
    rank: 7,
    name: 'changelog-generator',
    desc: 'Analyze git commits since the last release tag and generate a structured changelog. Draft release notes for review.',
    fullDesc: 'Automatically generates changelogs by analyzing git commit history since the last release tag. Groups changes by type (features, fixes, breaking changes), drafts release notes in conventional format, and prepares them for team review before publishing.',
    tags: ['automation', 'git', 'release'],
    cron: '0 18 * * 5',
    cronLabel: 'Fridays at 6 PM',
    timeout: 30,
    retry: 0,
    installs: '1.6K',
    category: 'automation',
    allowedSkills: [],
    condition: '',
    steps: ['Find last release tag', 'Analyze commits since tag', 'Group by conventional type', 'Draft release notes'],
    body: `# Changelog Generator

## Objective

Analyze git commits since the last release tag and generate a structured changelog. Draft release notes for review.

## Execution Steps

1. Find the last release tag in git history
2. Analyze all commits since that tag
3. Group changes by conventional commit type (feat, fix, breaking, etc.)
4. Draft structured release notes

## Output Requirements

- Categorized changelog (Features, Fixes, Breaking Changes, etc.)
- Draft release notes ready for review
- Statistics (commit count, contributors, files changed)`
  },
  {
    rank: 8,
    name: 'doc-sync-checker',
    desc: 'Compare API endpoints in code with documentation. Flag mismatches, missing docs, and outdated examples for developers to fix.',
    fullDesc: 'Validates documentation accuracy by comparing API endpoints defined in code against their documentation. Identifies mismatches, missing documentation, outdated examples, and parameter changes. Generates actionable reports for developers.',
    tags: ['maintenance', 'docs', 'api'],
    cron: '0 7 * * 3',
    cronLabel: 'Wednesdays at 7 AM',
    timeout: 45,
    retry: 0,
    installs: '1.2K',
    category: 'maintenance',
    allowedSkills: [],
    condition: '',
    steps: ['Extract API endpoints from code', 'Parse documentation references', 'Compare parameters and responses', 'Generate mismatch report'],
    body: `# Doc Sync Checker

## Objective

Compare API endpoints in code with documentation. Flag mismatches, missing docs, and outdated examples for developers to fix.

## Execution Steps

1. Extract API endpoint definitions from source code
2. Parse documentation references and examples
3. Compare parameters, return types, and descriptions
4. Generate a mismatch report

## Output Requirements

- List of undocumented endpoints
- List of outdated documentation
- Parameter mismatch details
- Recommended fixes for each issue`
  }
];

export const agents = [
  'Claude Code', 'Cursor', 'Codex', 'GitHub Copilot', 'Windsurf',
  'Gemini', 'Cline', 'AMP', 'Roo', 'Goose', 'Kiro CLI',
  'OpenCode', 'Trae', 'VS Code', 'Antigravity'
];

export function parseInstalls(s: string): number {
  const num = parseFloat(s);
  return s.includes('K') ? num * 1000 : num;
}

export function generatePrompt(job: Job): string {
  let p = `## Scheduled Job: ${job.name}\n\n${job.fullDesc || job.desc}\n\n`;
  p += `### Instructions\n\n`;
  p += `Read and follow the instructions in \`jobs/${job.name}/JOB.md\`.\n\n`;
  p += `- Respect the timeout: ${job.timeout} minutes\n`;
  p += `- Retry on failure: ${job.retry} times\n`;
  p += `- Allowed skills: ${job.allowedSkills.length ? job.allowedSkills.join(', ') : 'all'}\n`;
  p += `- Condition: ${job.condition || 'none'}\n\n`;
  p += `Execute the job now.`;
  return p;
}
