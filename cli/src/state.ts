import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { CronExpressionParser } from 'cron-parser';
import { AGENTS_DIR, REGISTRY_PATH, readRegistry, writeRegistry } from './registry';
import { Registry, Job, RunRecord, DaemonState, JobSummary } from './types';

export const STATE_DIR = path.join(AGENTS_DIR, 'jobs-state');
export const RUNS_DIR = path.join(STATE_DIR, 'runs');
export const DAEMON_STATE_PATH = path.join(STATE_DIR, 'daemon.json');

export function ensureStateDir(): void {
  if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
  if (!fs.existsSync(RUNS_DIR)) fs.mkdirSync(RUNS_DIR, { recursive: true });
}

export function getMachineId(): string {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal && iface.mac) {
          return iface.mac;
        }
      }
    }
    return os.hostname();
  } catch {
    return 'unknown';
  }
}

export const MACHINE_ID = getMachineId();

export function nowIso(): string {
  return new Date().toISOString();
}

export function safeNextRun(cron: string, currentDate: Date = new Date()): string | null {
  try {
    return CronExpressionParser.parse(cron, { currentDate }).next().toISOString();
  } catch {
    return null;
  }
}

export function normalizeJob(job: Partial<Job> & { name: string }): Job {
  return {
    name: job.name,
    cron: job.cron || '',
    description: job.description || '',
    source: job.source || '',
    sourcePath: job.sourcePath || job.source || '',
    condition: job.condition || '',
    allowedSkills: job.allowedSkills || [],
    timeout: job.timeout ?? 60,
    retry: job.retry ?? 0,
    tags: job.tags || [],
    command: job.command || '',
    cwd: job.cwd || '',
    body: job.body || '',
    enabled: job.enabled !== false,
    installedAt: job.installedAt || nowIso(),
    lastRun: job.lastRun ?? null,
    lastStartedAt: job.lastStartedAt ?? null,
    lastFinishedAt: job.lastFinishedAt ?? null,
    lastSuccessAt: job.lastSuccessAt ?? null,
    lastFailureAt: job.lastFailureAt ?? null,
    lastStatus: job.lastStatus || 'idle',
    lastError: job.lastError ?? null,
    lastExitReason: job.lastExitReason ?? null,
    runCount: Number.isFinite(job.runCount) ? job.runCount! : 0,
    consecutiveFailures: Number.isFinite(job.consecutiveFailures) ? job.consecutiveFailures! : 0,
    nextRun: job.nextRun ?? safeNextRun(job.cron || '* * * * *'),
    history: Array.isArray(job.history) ? job.history.slice(-20) : [],
    pid: job.pid ?? null
  } as Job;
}

export function normalizeRegistry(registry: Partial<Registry> = readRegistry()): Registry {
  return {
    version: registry.version || '1.1.0',
    jobs: (registry.jobs || []).map(j => normalizeJob(j))
  };
}

export function ensureRegistryState(): Registry {
  if (!fs.existsSync(REGISTRY_PATH)) {
    writeRegistry({ version: '1.1.0', jobs: [] });
  }
  const normalized = normalizeRegistry(readRegistry());
  writeRegistry(normalized);
  ensureStateDir();
  return normalized;
}

export function updateJob(
  name: string, 
  updater: ((job: Job) => Partial<Job>) | Partial<Job>
): Job {
  const registry = normalizeRegistry(readRegistry());
  const index = registry.jobs.findIndex(job => job.name === name);
  if (index < 0) throw new Error(`Job "${name}" not found`);

  const current = registry.jobs[index];
  const updates = typeof updater === 'function' ? updater(current) : updater;
  const next = normalizeJob({ ...current, ...updates });
  registry.jobs[index] = next;
  writeRegistry(registry);
  return next;
}

export function appendRunLog(name: string, record: RunRecord): string {
  ensureStateDir();
  const logPath = path.join(RUNS_DIR, `${name}.jsonl`);
  const enriched: RunRecord = { ...record, machineId: MACHINE_ID };
  fs.appendFileSync(logPath, `${JSON.stringify(enriched)}\n`);
  return logPath;
}

export function readRunLog(name: string, limit = 50): RunRecord[] {
  ensureStateDir();
  const logPath = path.join(RUNS_DIR, `${name}.jsonl`);
  if (!fs.existsSync(logPath)) return [];
  const rows = fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean);
  return rows.slice(-limit).map(line => {
    try {
      return JSON.parse(line) as RunRecord;
    } catch {
      return null;
    }
  }).filter((r): r is RunRecord => r !== null);
}

export function writeDaemonState(partial: Partial<DaemonState>): DaemonState {
  ensureStateDir();
  let current: Partial<DaemonState>;
  try {
    current = JSON.parse(fs.readFileSync(DAEMON_STATE_PATH, 'utf8'));
  } catch {
    current = { status: 'stopped', pid: null, startedAt: null, heartbeatAt: null, lastWakeGapMs: 0 };
  }
  const next: DaemonState = { ...current, ...partial } as DaemonState;
  fs.writeFileSync(DAEMON_STATE_PATH, JSON.stringify(next, null, 2));
  return next;
}

export function readDaemonState(): DaemonState {
  ensureStateDir();
  if (!fs.existsSync(DAEMON_STATE_PATH)) {
    return writeDaemonState({});
  }
  try {
    return JSON.parse(fs.readFileSync(DAEMON_STATE_PATH, 'utf8')) as DaemonState;
  } catch {
    return writeDaemonState({ status: 'stopped', pid: null, startedAt: null, heartbeatAt: null, lastWakeGapMs: 0 });
  }
}

export function summarizeJobs(): JobSummary[] {
  const registry = normalizeRegistry(readRegistry());
  return registry.jobs.map(job => ({
    name: job.name,
    description: job.description,
    cron: job.cron,
    sourcePath: job.sourcePath,
    enabled: job.enabled,
    nextRun: job.nextRun,
    lastRun: job.lastRun,
    lastStatus: job.lastStatus,
    lastError: job.lastError,
    lastExitReason: job.lastExitReason,
    runCount: job.runCount,
    consecutiveFailures: job.consecutiveFailures
  }));
}
