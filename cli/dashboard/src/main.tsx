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
  sourcePath: string;
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

type DetailTab = 'detail' | 'history';

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

function runLogText(record?: RunRecord): string {
  if (!record) return '暂无运行日志';
  const output = [record.stdout, record.stderr].filter(Boolean).join('\n\n').trim();
  if (output) return output;
  return record.exitReason || '本次运行没有输出';
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
  const [selectedJobName, setSelectedJobName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('detail');

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

  useEffect(() => {
    const jobs = overview?.jobs || [];
    if (selectedJobName && !jobs.some((job) => job.name === selectedJobName)) {
      setSelectedJobName(null);
    }
  }, [overview, selectedJobName]);

  const selectedJob = useMemo(() => {
    const jobs = overview?.jobs || [];
    return jobs.find((job) => job.name === selectedJobName) || null;
  }, [overview, selectedJobName]);

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <h1 className="brand-title">OPENJOB DASHBOARD</h1>
          <p className="subtle">查看本机任务状态、执行历史、失败原因和 daemon 心跳。</p>
        </div>
        <button className="primary" onClick={loadOverview} disabled={loading}>
          {loading ? '刷新中' : '刷新'}
        </button>
      </header>

      {error && <div className="alert">{error}</div>}

      {!selectedJob && (
        <section className="job-cards" aria-label="任务状态">
          {(overview?.jobs || []).map((job) => (
            <JobCard
              key={job.name}
              job={job}
              onSelect={() => {
                setSelectedJobName(job.name);
                setActiveTab('detail');
              }}
            />
          ))}

          {!loading && overview?.jobs.length === 0 && (
            <div className="empty">暂无任务。使用 openjob add &lt;path&gt; 添加本地任务。</div>
          )}
        </section>
      )}

      {selectedJob && (
        <section className="detail-page">
          <JobDetail
            job={selectedJob}
            busyJob={busyJob}
            onAction={runAction}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onBack={() => setSelectedJobName(null)}
          />
        </section>
      )}
    </main>
  );
}

function Info({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? 'info info-wide' : 'info'}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function JobCard({
  job,
  onSelect,
}: {
  job: JobSummary;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className="job-card"
      onClick={onSelect}
    >
      <span className={`status-dot ${statusClass(job.lastStatus)}`} aria-hidden="true" />
      <span className="job-card-main">
        <span className="job-card-title">{job.name}</span>
        <span className="job-card-label">最近运行</span>
        <span className="job-card-desc">{formatDateTime(job.lastRun)}</span>
      </span>
      <span className={`pill ${statusClass(job.lastStatus)}`}>{job.lastStatus || 'idle'}</span>
    </button>
  );
}

function JobDetail({
  job,
  busyJob,
  onAction,
  activeTab,
  onTabChange,
  onBack,
}: {
  job: JobSummary;
  busyJob: string | null;
  onAction: (job: JobSummary, action: JobAction) => void;
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  onBack: () => void;
}) {
  const message = jobMessage(job);
  const latestRecord = getLatestRecord(job);
  const history = [...(job.history || [])].reverse();

  return (
    <article className="job-detail">
      <button className="back-button" type="button" onClick={onBack}>返回</button>
      <div className="job-head">
        <div>
          <p className="detail-kicker">任务详情</p>
          <h2>{job.name}</h2>
          <p>{job.description || '无描述'}</p>
        </div>
        <span className={`pill ${statusClass(job.lastStatus)}`}>{job.lastStatus || 'idle'}</span>
      </div>

      <div className="job-grid">
        <Info label="cron" value={job.cron} />
        <Info label="存放路径" value={job.sourcePath || '-'} wide />
        <Info label="下次执行" value={formatDateTime(job.nextRun)} />
        <Info label="上次执行" value={formatDateTime(job.lastRun)} />
        <Info label="连续失败" value={String(job.consecutiveFailures || 0)} />
      </div>

      <div className="actions">
        <button onClick={() => onAction(job, 'run')} disabled={busyJob !== null}>
          {busyJob === `${job.name}:run` ? '执行中' : '立即执行'}
        </button>
        <button onClick={() => onAction(job, job.enabled ? 'disable' : 'enable')} disabled={busyJob !== null}>
          {job.enabled ? '禁用' : '启用'}
        </button>
        <span className={job.enabled ? 'enabled' : 'disabled'}>{job.enabled ? 'enabled' : 'disabled'}</span>
      </div>

      <div className="tabs" role="tablist" aria-label="任务详情视图">
        <button
          type="button"
          className={activeTab === 'detail' ? 'active' : ''}
          onClick={() => onTabChange('detail')}
          role="tab"
          aria-selected={activeTab === 'detail'}
        >
          详情
        </button>
        <button
          type="button"
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => onTabChange('history')}
          role="tab"
          aria-selected={activeTab === 'history'}
        >
          运行历史
        </button>
      </div>

      {activeTab === 'detail' && (
        <>
          {message && (
            <div className={`message-line ${message.tone}`}>{message.text}</div>
          )}
          <pre>{runLogText(latestRecord)}</pre>
        </>
      )}

      {activeTab === 'history' && (
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>运行时间</th>
                <th>运行状态</th>
                <th>结束时间</th>
                <th>退出原因</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record, index) => (
                <tr key={`${record.startedAt || 'run'}-${index}`}>
                  <td>{formatDateTime(record.startedAt || record.finishedAt)}</td>
                  <td><span className={`pill ${statusClass(record.status)}`}>{record.status || 'idle'}</span></td>
                  <td>{formatDateTime(record.finishedAt)}</td>
                  <td>{record.exitReason || '-'}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={4}>暂无运行历史</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
