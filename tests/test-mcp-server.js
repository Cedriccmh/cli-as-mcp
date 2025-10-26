#!/usr/bin/env node

/**
 * Simple test script for scouts-mcp server
 * This script spawns the server, sends MCP protocol messages, and validates responses
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// ANSI colors for output
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

async function testServer() {
  log('\n=== Testing Scouts MCP Server ===\n', 'bright');
  
  const serverPath = join(projectRoot, 'dist', 'server.js');
  log(`Starting server: ${serverPath}`, 'blue');
  
  // Spawn the server process
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: projectRoot,
  });

  let testsPassed = 0;
  let testsFailed = 0;
  let serverReady = false;
  let buffer = '';

  // Collect server output
  server.stdout.on('data', (data) => {
    buffer += data.toString();
    // Try to parse complete JSON-RPC messages
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = JSON.parse(line);
          handleResponse(response);
        } catch (e) {
          log(`Server output: ${line}`, 'yellow');
        }
      }
    }
  });

  server.stderr.on('data', (data) => {
    const msg = data.toString();
    if (!msg.includes('ExperimentalWarning')) {
      log(`Server stderr: ${msg}`, 'yellow');
    }
  });

  server.on('error', (err) => {
    log(`Failed to start server: ${err.message}`, 'red');
    process.exit(1);
  });

  function handleResponse(response) {
    if (response.method === 'initialized') {
      serverReady = true;
      log('✓ Server initialized', 'green');
      testsPassed++;
    } else if (response.result) {
      if (response.result.tools) {
        log(`✓ Received tools list: ${response.result.tools.length} tool(s)`, 'green');
        testsPassed++;
        const scoutsTool = response.result.tools.find(t => t.name === 'scouts_search');
        if (scoutsTool) {
          log(`✓ Found scouts_search tool`, 'green');
          log(`  Description: ${scoutsTool.description.substring(0, 80)}...`, 'blue');
          testsPassed++;
        } else {
          log(`✗ scouts_search tool not found`, 'red');
          testsFailed++;
        }
      } else if (response.result.content) {
        log(`✓ Tool execution response received`, 'green');
        testsPassed++;
        const content = response.result.content;
        if (Array.isArray(content)) {
          content.forEach(item => {
            if (item.type === 'text') {
              log(`  Response: ${item.text}`, 'blue');
            }
          });
        }
      }
    } else if (response.error) {
      log(`✗ Error response: ${response.error.message}`, 'red');
      testsFailed++;
    }
  }

  function sendMessage(message) {
    const json = JSON.stringify(message) + '\n';
    server.stdin.write(json);
  }

  // Wait a bit for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 1: Initialize the connection
  log('\n[Test 1] Initializing connection...', 'bright');
  sendMessage(makeJsonRpcRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0',
    },
  }));

  await new Promise(resolve => setTimeout(resolve, 500));

  // Send initialized notification
  sendMessage({
    jsonrpc: '2.0',
    method: 'notifications/initialized',
  });

  await new Promise(resolve => setTimeout(resolve, 500));

  // Test 2: List available tools
  log('\n[Test 2] Listing available tools...', 'bright');
  sendMessage(makeJsonRpcRequest('tools/list'));

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 3: Call scouts_search with the test task
  log('\n[Test 3] Calling scouts_search tool...', 'bright');
  const taskPath = join(projectRoot, '.kilocode', 'sub-memory-bank', 'tasks', 'test-task.md');
  log(`  Task path: ${taskPath}`, 'blue');
  
  sendMessage(makeJsonRpcRequest('tools/call', {
    name: 'scouts_search',
    arguments: {
      taskPath: taskPath,
    },
  }));

  // Wait for tool execution to complete
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Check if result file was created
  try {
    const resultPath = join(projectRoot, '.kilocode', 'sub-memory-bank', 'result', 'test-task.md');
    const result = await readFile(resultPath, 'utf8');
    log(`✓ Result file created: ${resultPath}`, 'green');
    log(`  Content preview: ${result.substring(0, 100)}...`, 'blue');
    testsPassed++;
  } catch (err) {
    log(`✗ Result file not found or error: ${err.message}`, 'red');
    testsFailed++;
  }

  // Shutdown
  log('\n[Shutdown] Terminating server...', 'bright');
  server.kill('SIGTERM');
  
  await new Promise(resolve => setTimeout(resolve, 500));

  // Summary
  log('\n=== Test Summary ===', 'bright');
  log(`Tests passed: ${testsPassed}`, testsPassed > 0 ? 'green' : 'reset');
  log(`Tests failed: ${testsFailed}`, testsFailed > 0 ? 'red' : 'reset');
  
  if (testsFailed === 0) {
    log('\n✓ All tests passed!', 'green');
    process.exit(0);
  } else {
    log('\n✗ Some tests failed', 'red');
    process.exit(1);
  }
}

// Run tests
testServer().catch(err => {
  log(`Test error: ${err.message}`, 'red');
  console.error(err);
  process.exit(1);
});

