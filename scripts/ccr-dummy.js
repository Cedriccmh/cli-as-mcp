#!/usr/bin/env node
// Minimal CCR dummy that simulates progress and writes a result file.

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

function findTaskArg(argv) {
  // Look for a single argv element like: 'task file <path>'
  for (const a of argv) {
    if (typeof a === 'string' && a.toLowerCase().startsWith('task file ')) {
      const p = a.slice('task file '.length).trim().replace(/^"|"$/g, '');
      if (p) return p;
    }
  }
  return null;
}

async function computeResultPath(absTaskPath) {
  const taskDir = path.dirname(absTaskPath);
  const parts = taskDir.split(path.sep);
  const idx = parts.lastIndexOf('tasks');
  if (idx === -1) {
    throw new Error("taskPath must be under a 'tasks' directory");
  }
  parts[idx] = 'result';
  const resultDir = parts.join(path.sep);
  return path.join(resultDir, path.basename(absTaskPath));
}

async function main() {
  // Basic arg parsing
  const argv = process.argv.slice(2);
  // Expect: argv[0] === 'code', argv[1] === '--dangerously-skip-permissions', argv[2] matches 'task file ...'
  const taskPath = findTaskArg(argv);
  if (!taskPath) {
    console.error('dummy: missing task file arg');
    process.exit(2);
    return;
  }
  const absTaskPath = path.resolve(taskPath);

  // Simulate progress
  console.log('dummy: start');
  for (let i = 1; i <= 5; i++) {
    await new Promise(r => setTimeout(r, 500));
    console.log(`dummy: tick ${i}`);
  }

  // Ensure result exists
  const resultPath = await computeResultPath(absTaskPath);
  await fsp.mkdir(path.dirname(resultPath), { recursive: true });
  await fsp.writeFile(resultPath, `dummy result for ${absTaskPath}\n`, 'utf8');
  console.log('dummy: wrote result:', resultPath);
  console.error('dummy: stderr sample');
}

main().catch(err => {
  console.error('dummy: error', err && err.message ? err.message : String(err));
  process.exit(1);
});


