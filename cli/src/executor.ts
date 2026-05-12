import * as fs from 'fs';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { parseJob } from './parser';
import { appendRunLog, nowIso, safeNextRun, updateJob } from './state';
import { Job, JobRuntime, RunRecord, ShellResult, ConditionCheck, TriggerType } from './types';

export function extractCodeBlocks(markdown: string): string[] {
  const matches = [...markdown.matchAll(/```(?:bash|sh|shell)?\n([\s\S]*?)```/g)];
  return matches.map(match => match[1].trim()).filter(Boolean);
}

export function resolveJobRuntime(job: Job): JobRuntime {
  const jobSource = job.source;
  const parsed = parseJob(jobSource);
  const cwd = job.cwd || parsed.cwd || path.dirname(jobSource);
  const explicitCommand = job.command || parsed.command;
  const commands = explicitCommand ? [explicitCommand] : extractCodeBlocks(fs.readFileSync(jobSource, 'utf8'));

  return {
    parsed,
    cwd,
    command: explicitCommand || commands.join('\n\n').trim(),
    commandBlocks: commands
  };
}

export function shouldSkipForCondition(job: Job): ConditionCheck | null {
  if (!job.condition) return null;
  const looksLikeScript = job.condition.startsWith('./') || job.condition.startsWith('/') || job.condition.endsWith('.sh');
  if (!looksLikeScript) {
    return {
      skipped: true,
      reason: 'condition_requires_ai_evaluation'
    };
  }

  const resolved = path.isAbsolute(job.condition)
    ? job.condition
    : path.resolve(path.dirname(job.source), job.condition);

  if (!fs.existsSync(resolved)) {
    return {
      skipped: true,
      reason: `condition_script_not_found:${resolved}`
    };
  }

  return { skipped: false, script: resolved };
}

export function runShell(command: string, cwd: string, timeoutMs: number): Promise<ShellResult> {
  return new Promise((resolve) => {
    const child: ChildProcess = spawn('/bin/zsh', ['-lc', command], {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    let finished = false;
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 1500);
    }, timeoutMs);

    child.stdout?.on('data', chunk => { stdout += String(chunk); });
    child.stderr?.on('data', chunk => { stderr += String(chunk); });

    child.on('close', (code, signal) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve({ code, signal, stdout, stderr, timedOut, pid: child.pid! });
    });
  });
}

export async function executeJob(job: Job, trigger: TriggerType = 'manual'): Promise<RunRecord> {
  const runtime = resolveJobRuntime(job);
  const startedAt = nowIso();

  updateJob(job.name, current => ({
    ...current,
    lastRun: startedAt,
    lastStartedAt: startedAt,
    lastStatus: 'running',
    lastError: null,
    lastExitReason: null,
    pid: process.pid
  }));

  const condition = shouldSkipForCondition(job);
  if (condition?.skipped) {
    const finishedAt = nowIso();
    const record: RunRecord = {
      jobName: job.name,
      trigger,
      startedAt,
      finishedAt,
      status: 'skipped',
      exitReason: condition.reason || 'skipped',
      stdout: '',
      stderr: ''
    };
    appendRunLog(job.name, record);
    const nextRun = safeNextRun(job.cron, new Date(finishedAt));
    updateJob(job.name, current => ({
      ...current,
      lastFinishedAt: finishedAt,
      lastStatus: 'skipped',
      lastError: condition.reason || 'skipped',
      lastExitReason: (condition.reason || 'skipped') as import('./types').ExitReason,
      nextRun,
      pid: null,
      history: [...(current.history || []), record].slice(-20)
    }));
    return record;
  }

  if (condition?.script) {
    const check = await runShell(condition.script, runtime.cwd, 30_000);
    if (check.code !== 0) {
      const finishedAt = nowIso();
      const record: RunRecord = {
        jobName: job.name,
        trigger,
        startedAt,
        finishedAt,
        status: 'skipped',
        exitReason: 'condition_not_met',
        stdout: check.stdout,
        stderr: check.stderr
      };
      appendRunLog(job.name, record);
      const nextRun = safeNextRun(job.cron, new Date(finishedAt));
      updateJob(job.name, current => ({
        ...current,
        lastFinishedAt: finishedAt,
        lastStatus: 'skipped',
        lastError: check.stderr.trim() || check.stdout.trim() || 'condition_not_met',
        lastExitReason: 'condition_not_met',
        nextRun,
        pid: null,
        history: [...(current.history || []), record].slice(-20)
      }));
      return record;
    }
  }

  if (!runtime.command) {
    const finishedAt = nowIso();
    const record: RunRecord = {
      jobName: job.name,
      trigger,
      startedAt,
      finishedAt,
      status: 'failed',
      exitReason: 'no_executable_command',
      stdout: '',
      stderr: 'No `command` field and no bash/sh code block found in JOB.md'
    };
    appendRunLog(job.name, record);
    const nextRun = safeNextRun(job.cron, new Date(finishedAt));
    updateJob(job.name, current => ({
      ...current,
      lastFinishedAt: finishedAt,
      lastFailureAt: finishedAt,
      lastStatus: 'failed',
      lastError: record.stderr,
      lastExitReason: record.exitReason as import('./types').ExitReason,
      nextRun,
      pid: null,
      runCount: (current.runCount || 0) + 1,
      consecutiveFailures: (current.consecutiveFailures || 0) + 1,
      history: [...(current.history || []), record].slice(-20)
    }));
    return record;
  }

  const result = await runShell(runtime.command, runtime.cwd, (job.timeout || 60) * 60 * 1000);
  const finishedAt = nowIso();
  const success = !result.timedOut && result.code === 0;
  const record: RunRecord = {
    jobName: job.name,
    trigger,
    startedAt,
    finishedAt,
    status: success ? 'success' : 'failed',
    exitReason: result.timedOut ? 'timeout' : (result.signal ? `signal:${result.signal}` : `exit:${result.code}`),
    stdout: result.stdout,
    stderr: result.stderr,
    pid: result.pid
  };

  appendRunLog(job.name, record);
  const nextRun = safeNextRun(job.cron, new Date(finishedAt));
  updateJob(job.name, current => ({
    ...current,
    lastFinishedAt: finishedAt,
    lastSuccessAt: success ? finishedAt : current.lastSuccessAt || null,
    lastFailureAt: success ? current.lastFailureAt || null : finishedAt,
    lastStatus: record.status,
    lastError: success ? null : (record.stderr.trim() || record.stdout.trim() || record.exitReason),
    lastExitReason: record.exitReason as import('./types').ExitReason,
    nextRun,
    pid: null,
    runCount: (current.runCount || 0) + 1,
    consecutiveFailures: success ? 0 : (current.consecutiveFailures || 0) + 1,
    history: [...(current.history || []), record].slice(-20)
  }));

  return record;
}
