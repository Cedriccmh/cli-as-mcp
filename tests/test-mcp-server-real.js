#!/usr/bin/env node

/**
 * Simple test for real ccr command execution
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeJsonRpcRequest(method, params = {}) {
  return {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params,
  };
}

async function testRealCcr() {
  log('\n=== Testing with Real CCR Command ===\n', 'bright');
  
  const serverPath = join(projectRoot, 'dist', 'server.js');
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: projectRoot,
  });

  let buffer = '';

  server.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = JSON.parse(line);
          if (response.result?.content) {
            log('✓ Tool execution completed', 'green');
            const content = response.result.content;
            if (Array.isArray(content)) {
              content.forEach(item => {
                if (item.type === 'text') {
                  log(`  ${item.text}`, 'blue');
                }
              });
            }
          } else if (response.error) {
            log(`✗ Error: ${response.error.message}`, 'red');
          }
        } catch (e) {}
      }
    }
  });

  server.stderr.on('data', (data) => {
    const msg = data.toString();
    if (!msg.includes('ExperimentalWarning')) {
      log(`Server: ${msg}`, 'yellow');
    }
  });

  function sendMessage(message) {
    server.stdin.write(JSON.stringify(message) + '\n');
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  log('Initializing connection...', 'bright');
  sendMessage(makeJsonRpcRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-client', version: '1.0.0' },
  }));

  await new Promise(resolve => setTimeout(resolve, 500));
  sendMessage({ jsonrpc: '2.0', method: 'notifications/initialized' });
  await new Promise(resolve => setTimeout(resolve, 500));

  log('Calling scouts_search with real ccr...', 'bright');
  const taskPath = join(projectRoot, '.kilocode', 'sub-memory-bank', 'tasks', 'real-ccr-test.md');
  sendMessage(makeJsonRpcRequest('tools/call', {
    name: 'scouts_search',
    arguments: { taskPath },
  }));

  // Wait up to 2 minutes for ccr to complete
  log('Waiting for ccr to complete (timeout: 2 minutes)...', 'yellow');
  await new Promise(resolve => setTimeout(resolve, 120000));

  // Check result
  try {
    const resultPath = join(projectRoot, '.kilocode', 'sub-memory-bank', 'result', 'real-ccr-test.md');
    const result = await readFile(resultPath, 'utf8');
    log(`✓ Result file created successfully`, 'green');
    log(`  Size: ${result.length} bytes`, 'blue');
    if (result.length > 200) {
      log(`  Preview:\n${result.substring(0, 200)}...`, 'blue');
    } else {
      log(`  Content:\n${result}`, 'blue');
    }
    server.kill('SIGTERM');
    process.exit(0);
  } catch (err) {
    log(`✗ Result file error: ${err.message}`, 'red');
    server.kill('SIGTERM');
    process.exit(1);
  }
}

testRealCcr().catch(err => {
  log(`Error: ${err.message}`, 'red');
  process.exit(1);
});

