const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { generatePrompt } = require('./prompt');

const CLAUDE_TASKS_PATH = path.join(process.env.HOME || '', '.claude', 'scheduled_tasks.json');

function readClaudeTasks() {
  if (!fs.existsSync(CLAUDE_TASKS_PATH)) return [];
  try { return JSON.parse(fs.readFileSync(CLAUDE_TASKS_PATH, 'utf8')); }
  catch { return []; }
}

function writeClaudeTasks(tasks) {
  const dir = path.dirname(CLAUDE_TASKS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CLAUDE_TASKS_PATH, JSON.stringify(tasks, null, 2));
}

function syncToClaude(registry) {
  const claudeTasks = readClaudeTasks();
  // Remove tasks from our source (tagged with source field in prompt)
  const ourPrefix = '## Scheduled Job:';
  const otherTasks = claudeTasks.filter(t => !t.prompt || !t.prompt.includes(ourPrefix));

  // Add enabled jobs
  const enabledJobs = registry.jobs.filter(j => j.enabled);
  const newTasks = enabledJobs.map(job => ({
    id: crypto.randomUUID().slice(0, 8),
    cron: job.cron,
    prompt: generatePrompt({
      name: job.name,
      source: job.source,
      description: job.description,
      timeout: job.timeout,
      retry: job.retry,
      allowedSkills: job.allowedSkills,
      condition: job.condition
    }),
    createdAt: Date.now(),
    recurring: true
  }));

  writeClaudeTasks([...otherTasks, ...newTasks]);
  return { synced: enabledJobs.length, removed: claudeTasks.length - otherTasks.length };
}

module.exports = { syncToClaude, readClaudeTasks };
