import * as fs from 'fs';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { STATE_DIR, ensureStateDir, nowIso } from './state';

export interface KeepAwakeState {
  enabled: boolean;
  pid: number | null;
  startedAt: string | null;
  lastError: string | null;
}

const PMSET_PATH = '/usr/bin/pmset';

const keepAwakeDeps = {
  statePath: path.join(STATE_DIR, 'keep-awake.json'),
  platform: () => process.platform,
  pmsetExists: () => fs.existsSync(PMSET_PATH),
  ensureStateDir: () => ensureStateDir(),
  nowIso: () => nowIso(),
  spawnNoIdle: () => spawn(PMSET_PATH, ['noidle'], { detached: true, stdio: 'ignore' }),
  processExists: (pid: number | null) => {
    if (!pid || pid <= 0) return false;
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  },
  killProcess: (pid: number, signal: NodeJS.Signals) => {
    process.kill(pid, signal);
  },
};

function defaultState(): KeepAwakeState {
  return {
    enabled: false,
    pid: null,
    startedAt: null,
    lastError: null,
  };
}

function writeKeepAwakeState(state: KeepAwakeState): KeepAwakeState {
  keepAwakeDeps.ensureStateDir();
  fs.writeFileSync(keepAwakeDeps.statePath, JSON.stringify(state, null, 2));
  return state;
}

function readStoredState(): KeepAwakeState {
  keepAwakeDeps.ensureStateDir();
  if (!fs.existsSync(keepAwakeDeps.statePath)) {
    return writeKeepAwakeState(defaultState());
  }

  try {
    return { ...defaultState(), ...(JSON.parse(fs.readFileSync(keepAwakeDeps.statePath, 'utf8')) as Partial<KeepAwakeState>) };
  } catch {
    return writeKeepAwakeState(defaultState());
  }
}

export function readKeepAwakeState(): KeepAwakeState {
  const state = readStoredState();
  if (!state.enabled) {
    if (state.lastError) {
      return writeKeepAwakeState({ enabled: false, pid: null, startedAt: null, lastError: null });
    }
    return state;
  }
  if (keepAwakeDeps.processExists(state.pid)) return state;

  return writeKeepAwakeState({
    enabled: false,
    pid: null,
    startedAt: null,
    lastError: '防休眠进程已退出，点击上方开关可重新启用',
  });
}

function assertSupported(): void {
  if (keepAwakeDeps.platform() !== 'darwin') {
    throw new Error('Keep awake is only supported on macOS');
  }
  if (!keepAwakeDeps.pmsetExists()) {
    throw new Error('pmset is not available on this machine');
  }
}

function assertSpawnedProcess(child: ChildProcess): number {
  child.unref();

  if (!child.pid) {
    throw new Error('Failed to start pmset noidle');
  }

  if (!keepAwakeDeps.processExists(child.pid)) {
    throw new Error('pmset noidle exited before keep-awake was enabled');
  }

  return child.pid;
}

export function enableKeepAwake(): KeepAwakeState {
  assertSupported();

  const current = readKeepAwakeState();
  if (current.enabled && keepAwakeDeps.processExists(current.pid)) {
    return current;
  }

  const pid = assertSpawnedProcess(keepAwakeDeps.spawnNoIdle());

  return writeKeepAwakeState({
    enabled: true,
    pid,
    startedAt: keepAwakeDeps.nowIso(),
    lastError: null,
  });
}

export function disableKeepAwake(): KeepAwakeState {
  const current = readStoredState();

  if (keepAwakeDeps.processExists(current.pid)) {
    try {
      keepAwakeDeps.killProcess(current.pid!, 'SIGTERM');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return writeKeepAwakeState({
        enabled: false,
        pid: null,
        startedAt: null,
        lastError: message,
      });
    }
  }

  return writeKeepAwakeState({
    enabled: false,
    pid: null,
    startedAt: null,
    lastError: null,
  });
}

export const keepAwakeInternals = {
  readStoredState,
  writeKeepAwakeState,
  setStatePathForTests(statePath: string) {
    keepAwakeDeps.statePath = statePath;
  },
  setPlatformForTests(platform: NodeJS.Platform) {
    keepAwakeDeps.platform = () => platform;
  },
  setPmsetExistsForTests(value: boolean) {
    keepAwakeDeps.pmsetExists = () => value;
  },
  setNowIsoForTests(value: string) {
    keepAwakeDeps.nowIso = () => value;
  },
  setSpawnNoIdleForTests(spawnNoIdle: () => ChildProcess) {
    keepAwakeDeps.spawnNoIdle = spawnNoIdle;
  },
  setProcessExistsForTests(processExists: (pid: number | null) => boolean) {
    keepAwakeDeps.processExists = processExists;
  },
  setKillProcessForTests(killProcess: (pid: number, signal: NodeJS.Signals) => void) {
    keepAwakeDeps.killProcess = killProcess;
  },
  resetForTests() {
    keepAwakeDeps.statePath = path.join(STATE_DIR, 'keep-awake.json');
    keepAwakeDeps.platform = () => process.platform;
    keepAwakeDeps.pmsetExists = () => fs.existsSync(PMSET_PATH);
    keepAwakeDeps.ensureStateDir = () => ensureStateDir();
    keepAwakeDeps.nowIso = () => nowIso();
    keepAwakeDeps.spawnNoIdle = () => spawn(PMSET_PATH, ['noidle'], { detached: true, stdio: 'ignore' });
    keepAwakeDeps.processExists = (pid: number | null) => {
      if (!pid || pid <= 0) return false;
      try {
        process.kill(pid, 0);
        return true;
      } catch {
        return false;
      }
    };
    keepAwakeDeps.killProcess = (pid: number, signal: NodeJS.Signals) => {
      process.kill(pid, signal);
    };
  },
};
