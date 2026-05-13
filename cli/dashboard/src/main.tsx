import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type DaemonStatus = 'running' | 'starting' | 'degraded' | 'stopped' | string;
type JobStatus = 'success' | 'failed' | 'running' | 'missed' | 'skipped' | 'idle' | string;
type JobAction = 'run' | 'enable' | 'disable';

type RunRecord = {
  status: JobStatus;
  startedAt?: string;
  finishedAt?: string;
  exitReason?: string;
  stdout?: string;
  stderr?: string;
};

type JobSummary = {
  name: string;
  description: string;
  cron: string;
  enabled: boolean;
  nextRun?: string;
  lastRun?: string;
  lastStatus?: JobStatus;
  lastError?: string;
  lastExitReason?: string;
  runCount: number;
  consecutiveFailures: number;
  history?: RunRecord[];
};

type OverviewResponse = {
  daemon: {
    status: DaemonStatus;
    pid?: number;
    startedAt?: string;
    heartbeatAt?: string;
    lastWakeGapMs?: number;
  };
  jobs: JobSummary[];
  machineId: string;
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZoneName: 'short',
});

function formatDateTime(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return dateFormatter.format(date);
}

function statusClass(status?: string): string {
  if (!status) return 'idle';
  return ['success', 'failed', 'running', 'missed', 'skipped'].includes(status) ? status : 'idle';
}

function historyText(history?: RunRecord[]): string {
  if (!history || history.length === 0) return '暂无执行记录';
  return history.slice(-3).map((item) => {
    const at = formatDateTime(item.finishedAt || item.startedAt);
    const output = item.stderr || item.stdout || '';
    const reason = item.status === 'success' && item.exitReason === 'exit:0' ? '' : (item.exitReason || '');
    return `[${item.status}] ${at} ${reason}\n${output}`.trim();
  }).join('\n\n');
}

function getLatestRecord(job: JobSummary): RunRecord | undefined {
  return job.history?.[job.history.length - 1];
}

function jobMessage(job: JobSummary): { tone: 'success' | 'error'; text: string } | null {
  const latest = getLatestRecord(job);
  const output = latest?.stderr?.trim() || latest?.stdout?.trim() || '';

  if (job.lastStatus === 'success') {
    if (output) {
      return { tone: 'success', text: output };
    }
    if (job.lastExitReason && job.lastExitReason !== 'exit:0') {
      return { tone: 'success', text: job.lastExitReason };
    }
    return null;
  }

  if (job.lastError || job.lastExitReason) {
    return { tone: 'error', text: job.lastError || job.lastExitReason || '' };
  }

  return null;
}

function App() {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyJob, setBusyJob] = useState<string | null>(null);

  async function loadOverview() {
    try {
      setError(null);
      const response = await fetch('/api/overview');
      if (!response.ok) throw new Error(`overview failed: ${response.status}`);
      setOverview(await response.json() as OverviewResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function runAction(job: JobSummary, action: JobAction) {
    setBusyJob(`${job.name}:${action}`);
    try {
      const response = await fetch(`/api/jobs/${encodeURIComponent(job.name)}/${action}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error(`${action} failed: ${response.status}`);
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyJob(null);
    }
  }

  useEffect(() => {
    loadOverview();
    const timer = window.setInterval(loadOverview, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    const jobs = overview?.jobs || [];
    return {
      total: jobs.length,
      enabled: jobs.filter((job) => job.enabled).length,
      failing: jobs.filter((job) => ['failed', 'missed'].includes(job.lastStatus || '')).length,
      running: jobs.filter((job) => job.lastStatus === 'running').length,
    };
  }, [overview]);

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Local Runner</p>
          <h1>openjob dashboard</h1>
          <p className="subtle">查看本机任务状态、执行历史、失败原因和 daemon 心跳。</p>
        </div>
        <button className="primary" onClick={loadOverview} disabled={loading}>
          {loading ? '刷新中' : '刷新'}
        </button>
      </header>

      {error && <div className="alert">{error}</div>}

      <section className="status-strip">
        <Metric label="任务总数" value={stats.total} />
        <Metric label="已启用" value={stats.enabled} />
        <Metric label="失败/错过" value={stats.failing} tone={stats.failing > 0 ? 'danger' : 'ok'} />
        <Metric label="运行中" value={stats.running} tone={stats.running > 0 ? 'info' : undefined} />
        <Metric
          label="daemon"
          value={overview?.daemon.status || '-'}
          tone={overview?.daemon.status === 'running' ? 'ok' : 'warn'}
        />
      </section>

      <section className="machine">
        <div>
          <span>机器</span>
          <strong>{overview?.machineId || '-'}</strong>
        </div>
        <div>
          <span>pid</span>
          <strong>{overview?.daemon.pid || '-'}</strong>
        </div>
        <div>
          <span>启动时间</span>
          <strong>{formatDateTime(overview?.daemon.startedAt)}</strong>
        </div>
        <div>
          <span>心跳</span>
          <strong>{formatDateTime(overview?.daemon.heartbeatAt)}</strong>
        </div>
      </section>

      <section className="jobs">
        {(overview?.jobs || []).map((job) => {
          const message = jobMessage(job);

          return <article className="job" key={job.name}>
            <div className="job-head">
              <div>
                <h2>{job.name}</h2>
                <p>{job.description || '无描述'}</p>
              </div>
              <span className={`pill ${statusClass(job.lastStatus)}`}>{job.lastStatus || 'idle'}</span>
            </div>

            <div className="job-grid">
              <Info label="cron" value={job.cron} />
              <Info label="下次执行" value={formatDateTime(job.nextRun)} />
              <Info label="上次执行" value={formatDateTime(job.lastRun)} />
              <Info label="连续失败" value={String(job.consecutiveFailures || 0)} />
            </div>

            <div className="actions">
              <button onClick={() => runAction(job, 'run')} disabled={busyJob !== null}>
                {busyJob === `${job.name}:run` ? '执行中' : '立即执行'}
              </button>
              <button onClick={() => runAction(job, job.enabled ? 'disable' : 'enable')} disabled={busyJob !== null}>
                {job.enabled ? '禁用' : '启用'}
              </button>
              <span className={job.enabled ? 'enabled' : 'disabled'}>{job.enabled ? 'enabled' : 'disabled'}</span>
            </div>

            {message && (
              <div className={`message-line ${message.tone}`}>{message.text}</div>
            )}
            <pre>{historyText(job.history)}</pre>
          </article>
        })}

        {!loading && overview?.jobs.length === 0 && (
          <div className="empty">暂无任务。使用 openjob add &lt;path&gt; 添加本地任务。</div>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className={`metric ${tone || ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="info">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
