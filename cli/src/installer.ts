import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { parseJob } from './parser';
import { JobDefinition } from './types';
import { ParsedSource, parseSource } from './source';

export interface ResolvedJob {
  job: JobDefinition;
  cleanup: () => void;
  parsed: ParsedSource;
}

interface Candidate {
  job: JobDefinition;
  filePath: string;
}

function resolveLocalPath(input: string): string {
  let filePath = input;
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'JOB.md');
  }
  return filePath;
}

function walkJobFiles(targetPath: string, results: string[]): void {
  if (!fs.existsSync(targetPath)) return;

  const stat = fs.statSync(targetPath);
  if (stat.isFile()) {
    if (path.basename(targetPath) === 'JOB.md') results.push(targetPath);
    return;
  }
  if (!stat.isDirectory()) return;

  for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const entryPath = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      walkJobFiles(entryPath, results);
    } else if (entry.isFile() && entry.name === 'JOB.md') {
      results.push(entryPath);
    }
  }
}

function discoverJobs(root: string): Candidate[] {
  const files: string[] = [];
  walkJobFiles(root, files);
  const candidates: Candidate[] = [];

  for (const filePath of files) {
    try {
      candidates.push({ job: parseJob(filePath), filePath });
    } catch {
      // Ignore JOB.md files that are not valid openjob definitions.
    }
  }

  return candidates;
}

function runGit(args: string[], cwd?: string): void {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  if (result.error) {
    if ((result.error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error('git is required to install jobs from remote repositories');
    }
    throw result.error;
  }

  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim();
    throw new Error(`git ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`);
  }
}

function cloneRepository(parsed: ParsedSource): string {
  if (!parsed.url) throw new Error('Missing git URL');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openjob-'));
  const repoDir = path.join(tempDir, 'repo');
  const args = ['clone', '--depth', '1'];
  if (parsed.ref) args.push('--branch', parsed.ref);
  args.push(parsed.url, repoDir);
  runGit(args);
  return tempDir;
}

function selectCandidate(candidates: Candidate[], parsed: ParsedSource): Candidate {
  if (candidates.length === 0) {
    const scope = parsed.subpath ? ` under "${parsed.subpath}"` : '';
    throw new Error(`No valid JOB.md found${scope}`);
  }

  if (parsed.jobName) {
    const matched = candidates.find(candidate => candidate.job.name === parsed.jobName);
    if (!matched) {
      const names = candidates.map(candidate => candidate.job.name).sort().join(', ');
      throw new Error(`Job "${parsed.jobName}" not found. Available jobs: ${names}`);
    }
    return matched;
  }

  if (candidates.length > 1) {
    const names = candidates.map(candidate => candidate.job.name).sort().join(', ');
    throw new Error(`Multiple jobs found: ${names}. Use @<job-name> or a more specific path.`);
  }

  return candidates[0];
}

function resolveRemoteJob(parsed: ParsedSource): ResolvedJob {
  const tempDir = cloneRepository(parsed);
  const repoDir = path.join(tempDir, 'repo');
  const searchRoot = parsed.subpath ? path.join(repoDir, parsed.subpath) : repoDir;

  try {
    const candidates = discoverJobs(searchRoot);
    const selected = selectCandidate(candidates, parsed);
    return {
      job: {
        ...selected.job,
        source: selected.filePath,
        sourcePath: selected.filePath,
        originalSource: parsed.input
      },
      cleanup: () => fs.rmSync(tempDir, { recursive: true, force: true }),
      parsed
    };
  } catch (error) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    throw error;
  }
}

function resolveLocalJob(parsed: ParsedSource): ResolvedJob {
  const filePath = resolveLocalPath(parsed.input);
  const job = parseJob(filePath);
  return {
    job,
    cleanup: () => undefined,
    parsed
  };
}

export function resolveJobSource(input: string): ResolvedJob {
  const localPath = resolveLocalPath(input);
  if (fs.existsSync(localPath)) {
    return resolveLocalJob({ type: 'local', input });
  }

  const parsed = parseSource(input);
  if (parsed.type === 'local') return resolveLocalJob(parsed);
  return resolveRemoteJob(parsed);
}

export const installerInternals = {
  discoverJobs,
  resolveRemoteJob,
  selectCandidate,
  runGit
};
