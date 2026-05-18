import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveAgentsDir } from '../src/registry';
import { parseSource } from '../src/source';
import { installerInternals } from '../src/installer';

const tempDirs: string[] = [];

function run(command: string, args: string[], cwd: string): void {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed: ${(result.stderr || result.stdout).trim()}`);
  }
}

function writeJob(dir: string, name: string): void {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'JOB.md'), `---
name: ${name}
cron: 0 9 * * *
description: ${name} description
---

# ${name}
`);
}

function createTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'openjob-test-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('parseSource', () => {
  it('parses GitHub URLs and shorthand sources', () => {
    expect(parseSource('https://github.com/owner/repo')).toMatchObject({
      type: 'github',
      url: 'https://github.com/owner/repo.git'
    });
    expect(parseSource('https://github.com/owner/repo.git')).toMatchObject({
      type: 'github',
      url: 'https://github.com/owner/repo.git'
    });
    expect(parseSource('https://github.com/owner/repo/tree/main/jobs/foo')).toMatchObject({
      type: 'github',
      url: 'https://github.com/owner/repo.git',
      ref: 'main',
      subpath: 'jobs/foo'
    });
    expect(parseSource('owner/repo')).toMatchObject({
      type: 'github',
      url: 'https://github.com/owner/repo.git'
    });
    expect(parseSource('owner/repo/jobs/foo')).toMatchObject({
      type: 'github',
      url: 'https://github.com/owner/repo.git',
      subpath: 'jobs/foo'
    });
    expect(parseSource('owner/repo@daily')).toMatchObject({
      type: 'github',
      url: 'https://github.com/owner/repo.git',
      jobName: 'daily'
    });
    expect(parseSource('owner/repo#dev')).toMatchObject({
      type: 'github',
      url: 'https://github.com/owner/repo.git',
      ref: 'dev'
    });
    expect(parseSource('owner/repo#dev@daily')).toMatchObject({
      type: 'github',
      url: 'https://github.com/owner/repo.git',
      ref: 'dev',
      jobName: 'daily'
    });
  });

  it('keeps local paths as local sources', () => {
    expect(parseSource('./docs/page.md#anchor')).toMatchObject({
      type: 'local',
      input: './docs/page.md#anchor'
    });
  });
});

describe('registry paths', () => {
  it('resolves global agents dir from os homedir when HOME is missing', () => {
    expect(resolveAgentsDir({} as NodeJS.ProcessEnv, () => '/tmp/openjob-global-home'))
      .toBe('/tmp/openjob-global-home/.agents');
  });
});

describe('installer internals', () => {
  it('resolves and filters jobs from a git repository', () => {
    const dir = createTempDir();
    const repo = path.join(dir, 'repo');
    fs.mkdirSync(repo);
    writeJob(path.join(repo, 'jobs', 'one'), 'one');
    writeJob(path.join(repo, 'jobs', 'two'), 'two');
    fs.mkdirSync(path.join(repo, 'docs'));
    fs.writeFileSync(path.join(repo, 'docs', 'JOB.md'), '# invalid');
    run('git', ['init'], repo);
    run('git', ['add', '.'], repo);
    run('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'seed jobs'], repo);

    const single = installerInternals.resolveRemoteJob({
      type: 'git',
      input: repo,
      url: repo,
      subpath: 'jobs/one'
    });
    try {
      expect(single.job.name).toBe('one');
      expect(fs.existsSync(single.job.sourcePath)).toBe(true);
    } finally {
      single.cleanup();
    }

    const filtered = installerInternals.resolveRemoteJob({
      type: 'git',
      input: repo,
      url: repo,
      subpath: 'jobs',
      jobName: 'two'
    });
    try {
      expect(filtered.job.name).toBe('two');
    } finally {
      filtered.cleanup();
    }
  });

  it('throws helpful errors for ambiguous or missing remote jobs', () => {
    const dir = createTempDir();
    const repo = path.join(dir, 'repo');
    fs.mkdirSync(repo);
    writeJob(path.join(repo, 'jobs', 'one'), 'one');
    writeJob(path.join(repo, 'jobs', 'two'), 'two');
    run('git', ['init'], repo);
    run('git', ['add', '.'], repo);
    run('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'seed jobs'], repo);

    expect(() => installerInternals.resolveRemoteJob({
      type: 'git',
      input: repo,
      url: repo,
      subpath: 'jobs'
    })).toThrow(/Multiple jobs found: one, two/);

    expect(() => installerInternals.resolveRemoteJob({
      type: 'git',
      input: repo,
      url: repo,
      subpath: 'missing'
    })).toThrow(/No valid JOB\.md found under "missing"/);
  });
});
