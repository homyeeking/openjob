import * as fs from 'fs';
import * as path from 'path';
import { Registry, Job } from './types';

export const AGENTS_DIR = path.join(process.env.HOME || process.cwd(), '.agents');
export const JOBS_DIR = path.join(AGENTS_DIR, 'jobs');
export const REGISTRY_PATH = path.join(AGENTS_DIR, 'jobs.json');

export function jobDir(name: string): string {
  return path.join(JOBS_DIR, name);
}

export function jobFile(name: string): string {
  return path.join(jobDir(name), 'JOB.md');
}

export function initRegistry(): Registry {
  const dir = path.dirname(REGISTRY_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(JOBS_DIR)) fs.mkdirSync(JOBS_DIR, { recursive: true });
  if (!fs.existsSync(REGISTRY_PATH)) {
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify({ version: '1.0.0', jobs: [] }, null, 2));
  }
  return readRegistry();
}

export function readRegistry(): Registry {
  if (!fs.existsSync(REGISTRY_PATH)) return { version: '1.0.0', jobs: [] };
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8')) as Registry;
}

export function writeRegistry(registry: Registry): void {
  const dir = path.dirname(REGISTRY_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(JOBS_DIR)) fs.mkdirSync(JOBS_DIR, { recursive: true });
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

export function addJob(job: Partial<Job> & { name: string; source: string; sourcePath: string }): Job {
  initRegistry();
  const sourcePath = job.sourcePath || job.source;
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    throw new Error(`Job source not found: ${sourcePath}`);
  }

  const targetDir = jobDir(job.name);
  const targetFile = jobFile(job.name);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  if (path.resolve(sourcePath) !== path.resolve(targetFile)) {
    fs.copyFileSync(sourcePath, targetFile);
  }

  const registry = readRegistry();
  const existing = registry.jobs.findIndex(j => j.name === job.name);
  const entry: Job = {
    name: job.name,
    source: targetFile,
    originalSource: job.originalSource || sourcePath,
    sourcePath: targetFile,
    cron: job.cron || '',
    description: job.description || '',
    condition: job.condition || '',
    allowedSkills: job.allowedSkills || [],
    timeout: job.timeout || 60,
    retry: job.retry || 0,
    tags: job.tags || [],
    command: job.command || '',
    cwd: job.cwd || '',
    enabled: true,
    installedAt: new Date().toISOString(),
    lastRun: null,
    lastStartedAt: null,
    lastFinishedAt: null,
    lastSuccessAt: null,
    lastFailureAt: null,
    nextRun: null,
    lastStatus: 'idle',
    lastError: null,
    lastExitReason: null,
    runCount: 0,
    consecutiveFailures: 0,
    history: [],
    pid: null
  };
  if (existing >= 0) {
    registry.jobs[existing] = entry;
  } else {
    registry.jobs.push(entry);
  }
  writeRegistry(registry);
  return entry;
}

export function removeJob(name: string): void {
  const registry = readRegistry();
  registry.jobs = registry.jobs.filter(j => j.name !== name);
  writeRegistry(registry);
  fs.rmSync(jobDir(name), { recursive: true, force: true });
}

export function enableJob(name: string): void {
  const registry = readRegistry();
  const job = registry.jobs.find(j => j.name === name);
  if (!job) throw new Error(`Job "${name}" not found`);
  job.enabled = true;
  writeRegistry(registry);
}

export function disableJob(name: string): void {
  const registry = readRegistry();
  const job = registry.jobs.find(j => j.name === name);
  if (!job) throw new Error(`Job "${name}" not found`);
  job.enabled = false;
  writeRegistry(registry);
}

export function getJob(name: string): Job | undefined {
  const registry = readRegistry();
  return registry.jobs.find(j => j.name === name);
}

export function listJobs(): Job[] {
  return readRegistry().jobs;
}
