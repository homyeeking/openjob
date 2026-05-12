import * as http from 'http';
import { execFileSync } from 'child_process';
import { 
  ensureRegistryState, 
  readDaemonState, 
  readRunLog, 
  summarizeJobs, 
  MACHINE_ID 
} from './state';
import { getJob, enableJob, disableJob } from './registry';
import { executeJob } from './executor';
import { OverviewResponse, RunRecord, JobSummary } from './types';

function json(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body, null, 2));
}

function htmlPage(machineId: string): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>jobs dashboard - ${machineId}</title>
  <style>
    :root { --bg:#0b1020; --panel:#131a2a; --muted:#93a4bf; --text:#eaf1ff; --ok:#22c55e; --warn:#f59e0b; --err:#ef4444; --line:#24304a; --accent:#60a5fa; }
    * { box-sizing:border-box; }
    body { margin:0; font-family:Inter,system-ui,sans-serif; background:linear-gradient(180deg,#0a0f1d,#0b1020); color:var(--text); }
    .wrap { max-width:1200px; margin:0 auto; padding:24px; }
    .hero { display:flex; justify-content:space-between; gap:16px; align-items:flex-start; margin-bottom:24px; }
    .hero h1 { margin:0 0 8px; font-size:28px; }
    .hero p { margin:0; color:var(--muted); }
    .grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
    .card, .job { background:rgba(19,26,42,.92); border:1px solid var(--line); border-radius:16px; padding:18px; box-shadow:0 10px 30px rgba(0,0,0,.2); }
    .metric { font-size:13px; color:var(--muted); }
    .metric strong { display:block; margin-top:6px; font-size:28px; color:var(--text); }
    .jobs { display:grid; gap:14px; }
    .job-head { display:flex; justify-content:space-between; gap:16px; align-items:flex-start; }
    .job h3 { margin:0 0 6px; font-size:18px; }
    .desc { color:var(--muted); margin:0 0 12px; }
    .meta { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin:14px 0; }
    .meta div { background:#0f1628; border:1px solid var(--line); border-radius:12px; padding:10px; }
    .meta span { display:block; color:var(--muted); font-size:12px; margin-bottom:4px; }
    .badge { display:inline-flex; padding:4px 10px; border-radius:999px; font-size:12px; border:1px solid var(--line); }
    .success { color:var(--ok); }
    .failed { color:var(--err); }
    .running { color:var(--accent); }
    .missed, .skipped { color:var(--warn); }
    .idle { color:var(--muted); }
    .metric strong.daemon-running { color:var(--ok); }
    .metric strong.daemon-starting { color:var(--accent); }
    .metric strong.daemon-degraded { color:var(--warn); }
    .metric strong.daemon-stopped { color:var(--err); }
    .actions { display:flex; gap:10px; margin-top:12px; flex-wrap:wrap; }
    button { background:#13203a; color:var(--text); border:1px solid #27406b; border-radius:10px; padding:10px 14px; cursor:pointer; }
    button:hover { border-color:var(--accent); }
    pre { white-space:pre-wrap; background:#0b1220; border:1px solid var(--line); border-radius:12px; padding:12px; color:#cbd5e1; max-height:220px; overflow:auto; }
    @media (max-width: 960px) { .grid, .meta { grid-template-columns:1fr 1fr; } }
    @media (max-width: 640px) { .grid, .meta { grid-template-columns:1fr; } .hero { flex-direction:column; } }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hero">
      <div>
        <h1>jobs dashboard</h1>
        <p>查看本机任务状态、上次/下次执行时间、失败原因，以及 daemon 心跳。</p>
        <p style="font-size:12px;color:var(--muted);margin-top:6px;" id="machineId">机器: ${machineId}</p>
      </div>
      <button onclick="loadAll()">刷新</button>
    </div>
    <div id="metrics" class="grid"></div>
    <div id="jobs" class="jobs"></div>
  </div>
  <script>
    async function api(path, options) {
      const res = await fetch(path, options);
      return res.json();
    }
    function esc(v) { return (v ?? '').toString().replace(/[&<>]/g, s => ({ '&':'&amp;','<':'&lt;','>':'&gt;' }[s])); }
    function statusClass(status) { return ['success','failed','running','missed','skipped','idle'].includes(status) ? status : 'idle'; }
    function daemonStatusClass(status) {
      return ['running', 'starting', 'degraded', 'stopped'].includes(status) ? 'daemon-' + status : '';
    }
    const userTimeZone = (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'local';
      } catch {
        return 'local';
      }
    })();
    function formatDateTime(value) {
      if (!value) return '-';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      try {
        return new Intl.DateTimeFormat(undefined, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          timeZoneName: 'short'
        }).format(date);
      } catch {
        return date.toLocaleString();
      }
    }
    function formatHistoryEntry(item) {
      const time = formatDateTime(item.finishedAt || item.startedAt || '');
      const reason = item.exitReason ? ' ' + item.exitReason : '';
      return '[' + item.status + '] ' + time + reason + '\\\\n' + (item.stderr || item.stdout || '');
    }
    async function trigger(name, action) {
      await api('/api/jobs/' + encodeURIComponent(name) + '/' + action, { method:'POST' });
      await loadAll();
    }
    async function loadAll() {
      const data = await api('/api/overview');
      const metrics = document.getElementById('metrics');
      const daemonStatus = data.daemon.status || 'unknown';
      metrics.innerHTML = (
        '<div class="card metric">任务总数<strong>' + data.jobs.length + '</strong></div>' +
        '<div class="card metric">已启用<strong>' + data.jobs.filter(j => j.enabled).length + '</strong></div>' +
        '<div class="card metric">失败/错过<strong>' + data.jobs.filter(j => ['failed','missed'].includes(j.lastStatus)).length + '</strong></div>' +
        '<div class="card metric">daemon<strong class="' + daemonStatusClass(daemonStatus) + '">' + esc(daemonStatus) + '</strong></div>');

      const machineEl = document.getElementById('machineId');
      if (machineEl) machineEl.textContent = '机器: ' + esc(data.machineId || '-');

      const jobsEl = document.getElementById('jobs');
      jobsEl.innerHTML = data.jobs.map(job => (
        '<section class="job">' +
          '<div class="job-head">' +
            '<div>' +
              '<h3>' + esc(job.name) + '</h3>' +
              '<p class="desc">' + esc(job.description) + '</p>' +
            '</div>' +
            '<span class="badge ' + statusClass(job.lastStatus) + '">' + esc(job.lastStatus || 'idle') + '</span>' +
          '</div>' +
          '<div class="meta">' +
            '<div><span>cron</span>' + esc(job.cron) + '</div>' +
            '<div><span>下次执行（' + esc(userTimeZone) + '）</span>' + esc(formatDateTime(job.nextRun)) + '</div>' +
            '<div><span>上次执行（' + esc(userTimeZone) + '）</span>' + esc(formatDateTime(job.lastRun)) + '</div>' +
            '<div><span>失败原因</span>' + esc(job.lastError || job.lastExitReason || '-') + '</div>' +
          '</div>' +
          '<div class="actions">' +
            '<button onclick="trigger(\\'' + esc(job.name) + '\\',\\'run\\')">立即执行</button>' +
            '<button onclick="trigger(\\'' + esc(job.name) + '\\',\\'' + (job.enabled ? 'disable' : 'enable') + '\\')">' + (job.enabled ? '禁用' : '启用') + '</button>' +
          '</div>' +
          '<pre>' + esc((job.history || []).slice(-3).map(formatHistoryEntry).join('\\n\\n') || '暂无执行记录') + '</pre>' +
        '</section>')).join('');
    }
    loadAll();
    setInterval(loadAll, 15000);
  </script>
</body>
</html>`;
}

function openBrowser(url: string): void {
  try {
    execFileSync('/usr/bin/open', [url], { stdio: 'ignore' });
  } catch {}
}

export function createServer(port = 0, autoOpen = true): http.Server {
  ensureRegistryState();
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(htmlPage(MACHINE_ID));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/overview') {
      const jobs: JobSummary[] = summarizeJobs().map((job: JobSummary) => ({ 
        ...job, 
        history: readRunLog(job.name, 5) 
      }));
      const response: OverviewResponse = { 
        daemon: readDaemonState(), 
        jobs, 
        machineId: MACHINE_ID 
      };
      json(res, 200, response);
      return;
    }

    const match = url.pathname.match(/\/api\/jobs\/([^/]+)\/(run|enable|disable)$/);
    if (match && req.method === 'POST') {
      const name = decodeURIComponent(match[1]);
      const action = match[2];
      try {
        if (action === 'run') {
          const job = getJob(name);
          if (!job) return json(res, 404, { error: 'job_not_found' });
          const result: RunRecord = await executeJob(job, 'dashboard_manual');
          return json(res, 200, result);
        }
        if (action === 'enable') enableJob(name);
        if (action === 'disable') disableJob(name);
        return json(res, 200, { ok: true });
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        return json(res, 500, { error: errorMsg });
      }
    }

    json(res, 404, { error: 'not_found' });
  });

  server.listen(port, '127.0.0.1', () => {
    const address = server.address();
    if (address && typeof address !== 'string') {
      const url = `http://127.0.0.1:${address.port}`;
      if (autoOpen) openBrowser(url);
      process.stdout.write(`${url}\\n`);
    }
  });

  return server;
}
