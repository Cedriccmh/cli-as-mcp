#!/usr/bin/env node
/*
 Direct runner to test spawning ccr (or dummy) without MCP.
 Usage:
   node scripts/run-direct.cjs --task .kilocode/sub-memory-bank/tasks/design-conflict-check.md

 Env:
   CCR_PATH                Path to ccr executable (e.g., C:\Users\<you>\AppData\Roaming\npm\ccr.cmd)
   SCOUTS_MCP_DEBUG_BIN    If set, run this binary instead of CCR
   SCOUTS_MCP_DEBUG_ARGS   JSON array of args; supports {taskPath} placeholder
*/

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { spawn } = require('child_process');

function stripWrappingQuotes(p) {
  if (!p) return p;
  if ((p.startsWith('"') && p.endsWith('"')) || (p.startsWith("'") && p.endsWith("'"))) {
    return p.slice(1, -1);
  }
  return p;
}

async function pathExists(p) {
  try { await fsp.access(p); return true; } catch { return false; }
}

function isPs1(p) { return String(p).toLowerCase().endsWith('.ps1'); }

function parseArgs(argv) {
  let task = '';
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--task' || a === '-t') { task = argv[++i] || ''; continue; }
  }
  if (!task) {
    console.error('Usage: node scripts/run-direct.cjs --task <task markdown path>');
    process.exit(2);
  }
  return { taskPath: task };
}

async function resolveTaskPath(inputPath) {
  const raw = String(inputPath || '').trim();
  if (!raw) throw new Error('taskPath is empty');
  const withoutAt = raw.startsWith('@') ? raw.slice(1) : raw;
  if (path.isAbsolute(withoutAt)) return path.resolve(withoutAt);

  const asGiven = path.resolve(withoutAt);
  if (await pathExists(asGiven)) return asGiven;

  const projectRoot = process.cwd();
  const prTasks = path.join(projectRoot, '.kilocode', 'sub-memory-bank', 'tasks', withoutAt);
  if (await pathExists(prTasks)) return prTasks;
  const prTasksMd = prTasks.endsWith('.md') ? prTasks : `${prTasks}.md`;
  if (await pathExists(prTasksMd)) return prTasksMd;

  throw new Error(`taskPath not found. Given: ${inputPath}`);
}

function computeResultPath(absTaskPath) {
  const taskDir = path.dirname(absTaskPath);
  const parts = taskDir.split(path.sep);
  const idx = parts.lastIndexOf('tasks');
  if (idx === -1) throw new Error("taskPath must be under a 'tasks' directory");
  parts[idx] = 'result';
  const resultDir = parts.join(path.sep);
  return path.join(resultDir, path.basename(absTaskPath));
}

function computeLogPaths(absTaskPath) {
  const taskDir = path.dirname(absTaskPath);
  const parts = taskDir.split(path.sep);
  const idx = parts.lastIndexOf('tasks');
  if (idx === -1) throw new Error("taskPath must be under a 'tasks' directory");
  parts[idx] = 'logs';
  const logsDir = parts.join(path.sep);
  const base = path.basename(absTaskPath, path.extname(absTaskPath));
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  return {
    latest: path.join(logsDir, `${base}.latest.log`),
    stamped: path.join(logsDir, `${base}.${ts}.log`),
    dir: logsDir,
  };
}

function getDebugOverride(taskPath) {
  const debugBin = (process.env.SCOUTS_MCP_DEBUG_BIN || '').trim();
  if (!debugBin) return null;
  const argsJson = (process.env.SCOUTS_MCP_DEBUG_ARGS || '').trim();
  let args = [];
  if (argsJson) {
    try {
      const parsed = JSON.parse(argsJson);
      if (Array.isArray(parsed)) args = parsed.map(String);
    } catch {
      args = argsJson.split(' ').filter(Boolean);
    }
  }
  args = args.map(a => a.replaceAll('{taskPath}', taskPath));
  return { command: debugBin, args };
}

async function resolveCcr() {
  const isWin = process.platform === 'win32';
  let envPath = stripWrappingQuotes((process.env.CCR_PATH || '').trim());
  if (envPath) {
    if (isWin && isPs1(envPath)) {
      return { command: 'powershell.exe', prefix: ['-NoProfile','-ExecutionPolicy','Bypass','-File', envPath] };
    }
    return { command: envPath, prefix: [] };
  }
  return { command: 'ccr', prefix: [] };
}

async function main() {
  const { taskPath } = parseArgs(process.argv);
  const absTaskPath = await resolveTaskPath(taskPath);

  const resultPath = computeResultPath(absTaskPath);
  const logs = computeLogPaths(absTaskPath);
  await fsp.mkdir(path.dirname(resultPath), { recursive: true });
  await fsp.mkdir(logs.dir, { recursive: true });
  const preface = `request accepted at ${new Date().toISOString()}\n`;
  try { await fsp.writeFile(logs.latest, preface, 'utf8'); } catch {}
  try { await fsp.writeFile(logs.stamped, preface, 'utf8'); } catch {}

  const debug = getDebugOverride(absTaskPath);
  let command, args;
  if (debug) {
    command = debug.command;
    args = [...debug.args];
  } else {
    const resolved = await resolveCcr();
    const promptArg = `task file ${absTaskPath}`;
    args = [...resolved.prefix, 'code', '--dangerously-skip-permissions', promptArg];
    command = resolved.command;
  }

  const logStreams = [fs.createWriteStream(logs.latest, { flags: 'a' }), fs.createWriteStream(logs.stamped, { flags: 'a' })];
  const startLine = `\n===== run-direct start ${new Date().toISOString()} =====\n` +
    `command: ${command}\n` +
    `args: ${JSON.stringify(args)}\n` +
    `cwd: ${process.cwd()}\n` +
    `mode: ${debug ? 'debug' : 'ccr'}\n`;
  for (const s of logStreams) s.write(startLine);

  console.log('[run-direct] spawning:', command, args);
  const child = spawn(command, args, {
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  child.stdout.on('data', (d) => {
    const t = d.toString();
    process.stdout.write(t);
    for (const s of logStreams) s.write(t);
  });
  child.stderr.on('data', (d) => {
    const t = d.toString();
    process.stderr.write(t);
    for (const s of logStreams) s.write(t);
  });
  child.on('error', (err) => {
    for (const s of logStreams) s.write(`\nspawn error: ${err.message}\n`);
    console.error('[run-direct] spawn error:', err.message);
  });
  child.on('close', async (code) => {
    if (code === 0) {
      try { await fsp.access(resultPath); } catch {}
      for (const s of logStreams) s.end(`\n===== run-direct end (ok) ${new Date().toISOString()} =====\n`);
      console.log('[run-direct] OK');
      console.log('result:', path.resolve(resultPath));
      console.log('log:', path.resolve(logs.latest));
      console.log('log_ts:', path.resolve(logs.stamped));
      process.exit(0);
    } else {
      for (const s of logStreams) s.end(`\n===== run-direct end (exit ${code}) ${new Date().toISOString()} =====\n`);
      console.error('[run-direct] EXIT CODE', code);
      console.log('result:', path.resolve(resultPath));
      console.log('log:', path.resolve(logs.latest));
      console.log('log_ts:', path.resolve(logs.stamped));
      process.exit(code || 1);
    }
  });
}

main().catch((err) => {
  console.error('[run-direct] fatal:', err && err.message ? err.message : String(err));
  process.exit(1);
});


