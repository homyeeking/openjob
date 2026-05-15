export type SourceType = 'local' | 'github' | 'git';

export interface ParsedSource {
  type: SourceType;
  input: string;
  url?: string;
  ref?: string;
  subpath?: string;
  jobName?: string;
}

const GITHUB_HOSTS = new Set(['github.com', 'www.github.com']);
const GIT_HOSTS = new Set(['github.com', 'www.github.com', 'gitlab.com', 'www.gitlab.com']);

function splitJobFilter(value: string): { source: string; jobName?: string } {
  const at = value.lastIndexOf('@');
  if (at <= 0 || at === value.length - 1) return { source: value };
  const before = value.slice(0, at);
  const after = value.slice(at + 1);
  if (after.includes('/') || after.includes('#')) return { source: value };
  return { source: before, jobName: after };
}

function splitGitFragment(value: string): { source: string; ref?: string; jobName?: string } {
  const hash = value.indexOf('#');
  if (hash < 0) return { source: value };
  const source = value.slice(0, hash);
  const fragment = value.slice(hash + 1);
  if (!fragment) return { source: value };
  const filter = splitJobFilter(fragment);
  return { source, ref: filter.source, jobName: filter.jobName };
}

function normalizeSubpath(parts: string[]): string | undefined {
  const cleanParts = parts.filter(Boolean);
  if (cleanParts.some(part => part === '.' || part === '..')) return undefined;
  const value = cleanParts.join('/');
  return value || undefined;
}

function parseGitUrl(input: string): ParsedSource | undefined {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return undefined;
  }

  if (!GIT_HOSTS.has(url.hostname)) return undefined;

  const isGitHub = GITHUB_HOSTS.has(url.hostname);
  const pathParts = url.pathname.split('/').filter(Boolean);
  if (pathParts.length < 2) return undefined;

  const owner = pathParts[0];
  const repo = pathParts[1].replace(/\.git$/, '');
  let ref: string | undefined;
  let subpath: string | undefined;

  if (isGitHub && pathParts[2] === 'tree' && pathParts[3]) {
    ref = decodeURIComponent(pathParts[3]);
    subpath = normalizeSubpath(pathParts.slice(4).map(decodeURIComponent));
  }

  let jobName: string | undefined;
  if (url.hash) {
    const fragment = splitJobFilter(url.hash.slice(1));
    if (fragment.source) ref = fragment.source;
    if (fragment.jobName) jobName = fragment.jobName;
  }

  return {
    type: isGitHub ? 'github' : 'git',
    input,
    url: `https://${url.hostname.replace(/^www\./, '')}/${owner}/${repo}.git`,
    ref,
    subpath,
    jobName
  };
}

function parseGitHubShorthand(input: string): ParsedSource | undefined {
  const fragment = splitGitFragment(input);
  const filter = splitJobFilter(fragment.source);
  const parts = filter.source.split('/').filter(Boolean);
  if (parts.length < 2) return undefined;

  const [owner, repoPart, ...subpathParts] = parts;
  if (!/^[A-Za-z0-9_.-]+$/.test(owner)) return undefined;
  if (!/^[A-Za-z0-9_.-]+$/.test(repoPart)) return undefined;
  if (owner === '.' || owner === '..' || repoPart === '.' || repoPart === '..') return undefined;
  if (owner.includes(':') || repoPart.includes(':')) return undefined;

  const repo = repoPart.replace(/\.git$/, '');
  return {
    type: 'github',
    input,
    url: `https://github.com/${owner}/${repo}.git`,
    ref: fragment.ref,
    subpath: normalizeSubpath(subpathParts),
    jobName: fragment.jobName || filter.jobName
  };
}

export function parseSource(input: string): ParsedSource {
  const trimmed = input.trim();
  const parsedUrl = parseGitUrl(trimmed);
  if (parsedUrl) return parsedUrl;

  const parsedShorthand = parseGitHubShorthand(trimmed);
  if (parsedShorthand) return parsedShorthand;

  return { type: 'local', input: trimmed };
}
