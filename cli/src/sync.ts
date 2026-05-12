import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { generatePrompt } from './prompt';
import { Registry, ClaudeTask } from './types';

const CLAUDE_TASKS_PATH = path.join(process.env.HOME || '', '.claude', 'scheduled_tasks.json');

export function readClaudeTasks(): ClaudeTask[] {
  if (!fs.existsSync(CLAUDE_TASKS_PATH)) return [];
  try { 
    return JSON.parse(fs.readFileSync(CLAUDE_TASKS_PATH, 'utf8')) as ClaudeTask[]; 
  }
  catch { 
    return []; 
  }
}

export function writeClaudeTasks(tasks: ClaudeTask[]): void {
  const dir = path.dirname(CLAUDE_TASKS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CLAUDE_TASKS_PATH, JSON.stringify(tasks, null, 2));
}

export function syncToClaude(registry: Registry): { synced: number; removed: number } {
  const claudeTasks = readClaudeTasks();
  const ourPrefix = '## Scheduled Job:';
  const otherTasks = claudeTasks.filter(t => !t.prompt || !t.prompt.includes(ourPrefix));

  const enabledJobs = registry.jobs.filter(j => j.enabled);
  const newTasks: ClaudeTask[] = enabledJobs.map(job => ({
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
