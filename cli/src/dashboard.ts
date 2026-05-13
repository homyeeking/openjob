import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
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

const DASHBOARD_DIST_DIR = path.resolve(__dirname, '../dashboard/dist');

function json(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body, null, 2));
}

function text(res: http.ServerResponse, status: number, body: string): void {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(body);
}

function contentType(filePath: string): string {
  switch (path.extname(filePath)) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.png':
      return 'image/png';
    case '.ico':
      return 'image/x-icon';
    case '.woff2':
      return 'font/woff2';
    default:
      return 'application/octet-stream';
  }
}

function dashboardIndexPath(): string | undefined {
  const indexPath = path.join(DASHBOARD_DIST_DIR, 'index.html');
  return fs.existsSync(indexPath) ? indexPath : undefined;
}

function resolveStaticPath(urlPathname: string): string | undefined {
  const requestedPath = decodeURIComponent(urlPathname);
  const relativePath = requestedPath === '/' ? 'index.html' : requestedPath.slice(1);
  const filePath = path.resolve(DASHBOARD_DIST_DIR, relativePath);

  if (filePath === DASHBOARD_DIST_DIR || !filePath.startsWith(DASHBOARD_DIST_DIR + path.sep)) {
    return undefined;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return filePath;
  }

  return dashboardIndexPath();
}

function serveStatic(urlPathname: string, method: string, res: http.ServerResponse): void {
  const filePath = resolveStaticPath(urlPathname);

  if (!filePath) {
    text(
      res,
      500,
      `Local dashboard assets are missing. Run "pnpm --dir dashboard build" from cli/ before using "openjob dashboard".\n`
    );
    return;
  }

  res.writeHead(200, { 'Content-Type': contentType(filePath) });
  if (method === 'HEAD') {
    res.end();
    return;
  }
  fs.createReadStream(filePath).pipe(res);
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

    if (req.method === 'GET' || req.method === 'HEAD') {
      serveStatic(url.pathname, req.method, res);
      return;
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
