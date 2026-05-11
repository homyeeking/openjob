const fs = require('fs');
const path = require('path');

const AGENTS_DIR = path.join(process.env.HOME || process.cwd(), '.agents');
const JOBS_DIR = path.join(AGENTS_DIR, 'jobs');
const REGISTRY_PATH = path.join(AGENTS_DIR, 'jobs.json');

function jobDir(name) {
  return path.join(JOBS_DIR, name);
}

function jobFile(name) {
  return path.join(jobDir(name), 'JOB.md');
}

function initRegistry() {
  const dir = path.dirname(REGISTRY_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(JOBS_DIR)) fs.mkdirSync(JOBS_DIR, { recursive: true });
  if (!fs.existsSync(REGISTRY_PATH)) {
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify({ version: '1.0.0', jobs: [] }, null, 2));
  }
  return readRegistry();
}

function readRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) return { version: '1.0.0', jobs: [] };
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
}

function writeRegistry(registry) {
  const dir = path.dirname(REGISTRY_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(JOBS_DIR)) fs.mkdirSync(JOBS_DIR, { recursive: true });
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

function addJob(job) {
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
  const entry = {
    name: job.name,
    source: targetFile,
    originalSource: sourcePath,
    cron: job.cron,
    description: job.description,
    condition: job.condition || '',
    allowedSkills: job.allowedSkills || [],
    timeout: job.timeout || 60,
    retry: job.retry || 0,
    tags: job.tags || [],
    enabled: true,
    installedAt: new Date().toISOString(),
    lastRun: null,
    lastStatus: null,
    runCount: 0
  };
  if (existing >= 0) {
    registry.jobs[existing] = entry;
  } else {
    registry.jobs.push(entry);
  }
  writeRegistry(registry);
  return entry;
}

function removeJob(name) {
  const registry = readRegistry();
  registry.jobs = registry.jobs.filter(j => j.name !== name);
  writeRegistry(registry);
  fs.rmSync(jobDir(name), { recursive: true, force: true });
}

function enableJob(name) {
  const registry = readRegistry();
  const job = registry.jobs.find(j => j.name === name);
  if (!job) throw new Error(`Job "${name}" not found`);
  job.enabled = true;
  writeRegistry(registry);
}

function disableJob(name) {
  const registry = readRegistry();
  const job = registry.jobs.find(j => j.name === name);
  if (!job) throw new Error(`Job "${name}" not found`);
  job.enabled = false;
  writeRegistry(registry);
}

function getJob(name) {
  const registry = readRegistry();
  return registry.jobs.find(j => j.name === name);
}

function listJobs() {
  return readRegistry().jobs;
}

module.exports = {
  AGENTS_DIR,
  JOBS_DIR,
  REGISTRY_PATH,
  initRegistry,
  readRegistry,
  writeRegistry,
  addJob,
  removeJob,
  enableJob,
  disableJob,
  getJob,
  listJobs
};
