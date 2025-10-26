#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import path from "node:path";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { fileURLToPath } from "node:url";

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function isPowerShellScript(p: string): boolean {
  return p.toLowerCase().endsWith(".ps1");
}

function isWindowsCmdScript(p: string): boolean {
  const lower = p.toLowerCase();
  return lower.endsWith(".cmd") || lower.endsWith(".bat");
}

async function resolveCcrInvocation(): Promise<{ command: string; prefixArgs: string[] }> {
  const isWin = process.platform === "win32";

  let envPath = process.env.CCR_PATH?.trim();
  // Strip wrapping quotes if provided in config, e.g., "C:\\path\\ccr.cmd"
  if (envPath && ((envPath.startsWith('"') && envPath.endsWith('"')) || (envPath.startsWith("'") && envPath.endsWith("'")))) {
    envPath = envPath.slice(1, -1);
  }
  if (envPath && envPath.length > 0) {
    // If user provided an explicit path, use it.
    if (isWin) {
      // For .ps1, run via PowerShell
      if (isPowerShellScript(envPath)) {
        return {
          command: "powershell.exe",
          prefixArgs: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", envPath],
        };
      }
      // For .cmd/.bat, run via cmd.exe (can't spawn .cmd directly with shell:false)
      if (isWindowsCmdScript(envPath)) {
        return {
          command: "cmd.exe",
          prefixArgs: ["/c", envPath],
        };
      }
    }
    return { command: envPath, prefixArgs: [] };
  }

  if (isWin) {
    // Prefer common npm global locations first
    const appData = process.env.APPDATA;
    const candidates: string[] = [];
    if (appData) {
      candidates.push(
        `${appData}\\npm\\ccr.cmd`,
        `${appData}\\npm\\ccr.exe`,
        `${appData}\\npm\\ccr.ps1`
      );
    }

    // Also search PATH with PATHEXT
    const pathDirs = (process.env.PATH || "").split(path.delimiter).filter(Boolean);
    const pathext = (process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM;.PS1").toLowerCase().split(";");
    for (const dir of pathDirs) {
      for (const ext of pathext) {
        const candidate = path.join(dir, `ccr${ext.toLowerCase()}`);
        candidates.push(candidate);
      }
    }

    for (const c of candidates) {
      if (await pathExists(c)) {
        if (isPowerShellScript(c)) {
          return {
            command: "powershell.exe",
            prefixArgs: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", c],
          };
        }
        if (isWindowsCmdScript(c)) {
          return {
            command: "cmd.exe",
            prefixArgs: ["/c", c],
          };
        }
        return { command: c, prefixArgs: [] };
      }
    }

    // Last resort on Windows: attempt to use 'ccr' in PATH
    return { command: "ccr", prefixArgs: [] };
  }

  // Non-Windows: rely on PATH or CCR_PATH
  return { command: "ccr", prefixArgs: [] };
}

/**
 * Run ccr code CLI with the given task file path.
 * Returns stdout and stderr from the process.
 * 
 * Note: ccr is an interactive tool that doesn't auto-exit. We detect task completion
 * by looking for the result file being created, then gracefully terminate ccr.
 */
async function runCcr(taskPath: string, logPaths?: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise(async (resolve, reject) => {
    const resolved = await resolveCcrInvocation();
    const promptArg = `task file ${taskPath}`;
    const args = [...resolved.prefixArgs, "code", "--dangerously-skip-permissions", promptArg];
    const command = resolved.command;

    // Determine spawn CWD from task path
    const inferredRoot = inferProjectRootFromTask(taskPath);
    const spawnCwd = inferredRoot || process.cwd();

    // Calculate expected result path for completion detection
    const expectedResultPath = computeResultPath(path.resolve(taskPath));

    // Prepare logging and state tracking before spawn
    let stdout = "";
    let stderr = "";
    let timeoutId: NodeJS.Timeout | null = null;
    let pollIntervalId: NodeJS.Timeout | null = null;
    let resultFileDetected = false;
    
    const logStreams: import("node:fs").WriteStream[] = [];
    if (logPaths && logPaths.length > 0) {
      for (const p of logPaths) {
        try {
          const s = createWriteStream(p, { flags: "a" });
          const startLine = `\n===== scouts-mcp run start ${new Date().toISOString()} =====\n` +
            `command: ${command}\n` +
            `args: ${JSON.stringify(args)}\n` +
            `cwd: ${spawnCwd}\n` +
            `expectedResultPath: ${expectedResultPath}\n` +
            ``;
          s.write(startLine);
          logStreams.push(s);
        } catch {}
      }
    }

    // Spawn process
    // Use 'pipe' for stdin so we can close it immediately to prevent hanging
    const child = spawn(command, args, {
      shell: false,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
      cwd: spawnCwd,
    });

    // Close stdin immediately to prevent ccr from waiting for input
    if (child.stdin) {
      child.stdin.end();
    }

    child.stdout.on("data", (d) => {
      stdout += d.toString();
      for (const s of logStreams) s.write(d);
    });

    child.stderr.on("data", (d) => {
      stderr += d.toString();
      for (const s of logStreams) s.write(d);
    });

    child.on("error", (err) => {
      // Clean up timers
      if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
      if (pollIntervalId) { clearInterval(pollIntervalId); pollIntervalId = null; }
      
      const hint = process.platform === "win32"
        ? " Set CCR_PATH to the full path of ccr.cmd or ensure ccr is on PATH."
        : " Ensure 'ccr' is installed and available on PATH, or set CCR_PATH.";
      for (const s of logStreams) {
        try { s.write(`\nspawn error: ${err.message}\n`); s.end(`===== scouts-mcp run end (error) ${new Date().toISOString()} =====\n`); } catch {}
      }
      reject(new Error(`Failed to spawn ccr: ${err.message}.${hint}`));
    });

    // Configurable timeout (default 10 minutes, or use CCR_TIMEOUT_MS env var)
    const timeoutMs = process.env.CCR_TIMEOUT_MS ? parseInt(process.env.CCR_TIMEOUT_MS, 10) : 10 * 60 * 1000;
    timeoutId = setTimeout(() => {
      if (pollIntervalId) { clearInterval(pollIntervalId); pollIntervalId = null; }
      try {
        child.kill();
      } catch {}
      for (const s of logStreams) {
        try { s.write(`\nERROR: ccr timed out after ${timeoutMs}ms\n`); s.end(`===== scouts-mcp run end (timeout) ${new Date().toISOString()} =====\n`); } catch {}
      }
      reject(new Error(`ccr timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    // Poll for result file completion (ccr doesn't auto-exit)
    // Check every 2 seconds if the result file has been created
    const pollInterval = 2000; // Check every 2 seconds
    const gracePeriod = 3000; // Wait 3 seconds after detecting file before killing
    
    pollIntervalId = setInterval(async () => {
      try {
        if (await pathExists(expectedResultPath)) {
          if (!resultFileDetected) {
            resultFileDetected = true;
            for (const s of logStreams) {
              try { s.write(`\n[DETECTION] Result file created: ${expectedResultPath}\n`); } catch {}
            }
            
            // Wait for grace period to let ccr finish writing
            setTimeout(() => {
              try {
                for (const s of logStreams) {
                  try { s.write(`\n[TERMINATION] Gracefully terminating ccr after grace period\n`); } catch {}
                }
                child.kill('SIGTERM');
                // Force kill if still running after 2 seconds
                setTimeout(() => {
                  try { child.kill('SIGKILL'); } catch {}
                }, 2000);
              } catch {}
            }, gracePeriod);
          }
        }
      } catch {}
    }, pollInterval);

    child.on("close", (code) => {
      // Clean up timers
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (pollIntervalId) {
        clearInterval(pollIntervalId);
        pollIntervalId = null;
      }

      // If we detected the result file, treat any exit code as success
      // (ccr was terminated by us after completing the task)
      if (resultFileDetected) {
        for (const s of logStreams) { 
          try { s.end(`\n===== scouts-mcp run end (result detected, terminated) ${new Date().toISOString()} =====\n`); } catch {} 
        }
        resolve({ stdout, stderr });
        return;
      }

      // Normal exit handling
      if (code === 0) {
        for (const s of logStreams) { try { s.end(`\n===== scouts-mcp run end (ok) ${new Date().toISOString()} =====\n`); } catch {} }
        resolve({ stdout, stderr });
      } else {
        for (const s of logStreams) { try { s.end(`\n===== scouts-mcp run end (exit ${code}) ${new Date().toISOString()} =====\n`); } catch {} }
        reject(new Error(stderr || `ccr exited with code ${code}`));
      }
    });
  });
}

/**
 * Compute the result path according to the spec:
 * From .../.kilocode/sub-memory-bank/tasks/<name>.md
 *   to .../.kilocode/sub-memory-bank/result/<name>.md
 * Throws if no 'tasks' segment is found in the taskPath.
 */
function computeResultPath(absTaskPath: string): string {
  const taskDir = path.dirname(absTaskPath);
  const parts = taskDir.split(path.sep);
  const idx = parts.lastIndexOf("tasks");
  if (idx === -1) {
    throw new Error(
      "taskPath must be under a 'tasks' directory per spec (.kilocode/sub-memory-bank/tasks/...)"
    );
  }
  parts[idx] = "result";
  const resultDir = parts.join(path.sep);
  return path.join(resultDir, path.basename(absTaskPath));
}

function computeLogPath(absTaskPath: string): string {
  const taskDir = path.dirname(absTaskPath);
  const parts = taskDir.split(path.sep);
  const idx = parts.lastIndexOf("tasks");
  if (idx === -1) {
    throw new Error(
      "taskPath must be under a 'tasks' directory per spec (.kilocode/sub-memory-bank/tasks/...)"
    );
  }
  parts[idx] = "logs";
  const logsDir = parts.join(path.sep);
  const base = path.basename(absTaskPath, path.extname(absTaskPath));
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(logsDir, `${base}.${ts}.log`);
}

function computeLatestLogPath(absTaskPath: string): string {
  const taskDir = path.dirname(absTaskPath);
  const parts = taskDir.split(path.sep);
  const idx = parts.lastIndexOf("tasks");
  if (idx === -1) {
    throw new Error(
      "taskPath must be under a 'tasks' directory per spec (.kilocode/sub-memory-bank/tasks/...)"
    );
  }
  parts[idx] = "logs";
  const logsDir = parts.join(path.sep);
  const base = path.basename(absTaskPath, path.extname(absTaskPath));
  return path.join(logsDir, `${base}.latest.log`);
}

async function resolveTaskPath(inputPath: string): Promise<string> {
  const raw = (inputPath || "").trim();
  if (!raw) {
    throw new Error("taskPath is empty");
  }

  const withoutAt = raw.startsWith("@") ? raw.slice(1) : raw;

  // Absolute path as provided
  if (path.isAbsolute(withoutAt)) {
    return path.resolve(withoutAt);
  }

  // As given, relative to current working directory
  const asGiven = path.resolve(withoutAt);
  if (await pathExists(asGiven)) {
    return asGiven;
  }

  // Relative to project root (based on dist/server.js location)
  try {
    const moduleDir = path.dirname(fileURLToPath(import.meta.url));
    const projectRoot = path.resolve(moduleDir, "..");
    const prCandidate = path.join(projectRoot, withoutAt);
    if (await pathExists(prCandidate)) {
      return prCandidate;
    }
    const prTasks = path.join(projectRoot, ".kilocode", "sub-memory-bank", "tasks", withoutAt);
    if (await pathExists(prTasks)) {
      return prTasks;
    }
    const prTasksMd = prTasks.endsWith(".md") ? prTasks : `${prTasks}.md`;
    if (await pathExists(prTasksMd)) {
      return prTasksMd;
    }
  } catch {}

  // Relative to cwd tasks dir
  const tasksDir = path.resolve(process.cwd(), ".kilocode", "sub-memory-bank", "tasks");
  const withDir = path.join(tasksDir, withoutAt);
  if (await pathExists(withDir)) {
    return withDir;
  }
  const withMd = withDir.endsWith(".md") ? withDir : `${withDir}.md`;
  if (await pathExists(withMd)) {
    return withMd;
  }

  throw new Error(`taskPath not found. Given: ${inputPath}`);
}

function inferProjectRootFromTask(absTaskPath: string): string | null {
  const taskDir = path.dirname(absTaskPath);
  const parts = taskDir.split(path.sep);
  const idx = parts.lastIndexOf("tasks");
  if (idx !== -1) {
    // tasks is under <root>/.kilocode/sub-memory-bank/tasks
    const rootParts = parts.slice(0, Math.max(0, idx - 2));
    if (rootParts.length > 0) {
      const leading = taskDir.startsWith(path.sep) ? path.sep : '';
      return path.join(leading, ...rootParts);
    }
  }
  return null;
}

/**
 * MCP server exposing scouts_search tool
 */
const server = new Server(
  {
    name: "scouts-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool input schema
const ScoutsSearchSchema = z.object({
  taskPath: z.string().min(1).describe("Path to the task.md file"),
});

// Handle list_tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "scouts_search",
        description: `Scouts: parallel hybrid search for large codebase understanding.

Input: a Scouts task markdown file path (taskPath). The task file must be located under the [.kilocode/sub-memory-bank/tasks/] directory. 

The task file should follow this format:

- /scouts:withScout
- # [Task Name]
- task_description: what to search/analyze
- task_type: feature | bug | refactor
- intents: 2-3 focused objectives for parallel execution
- domains: codebase | doc | commit_history
- file_types: e.g. .ts,.js,.py
- context: background info

This tool runs: ccr code --dangerously-skip-permissions 'task file <taskPath>'
Returns the absolute path to that result file.

Use for feature design, debugging, and refactoring; define focused intents and relevant domains for best results.`,
        inputSchema: {
          type: "object",
          properties: {
            taskPath: {
              type: "string",
              description: "Path to the task.md file",
            },
          },
          required: ["taskPath"],
        },
      },
    ],
  };
});

// Handle call_tool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (request.params.name !== "scouts_search") {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }

    // Validate input
    const args = ScoutsSearchSchema.parse(request.params.arguments);
    const absTaskPath = await resolveTaskPath(args.taskPath);
    const resultPath = computeResultPath(absTaskPath);
    const logPath = computeLogPath(absTaskPath);
    const latestLogPath = computeLatestLogPath(absTaskPath);
    const resultDir = path.dirname(resultPath);
    const logDir = path.dirname(logPath);

    // Ensure result directory exists
    await fs.mkdir(resultDir, { recursive: true });
    await fs.mkdir(logDir, { recursive: true });

    // Pre-create/prime logs so the user can tail immediately
    const preface = `request accepted at ${new Date().toISOString()}\n`;
    try { await fs.writeFile(latestLogPath, preface, "utf8"); } catch {}
    try { await fs.writeFile(logPath, preface, "utf8"); } catch {}

    // Run ccr
    const { stdout } = await runCcr(absTaskPath, [logPath, latestLogPath]);

    // Check if ccr created the expected result file
    let exists = false;
    try {
      await fs.access(resultPath);
      exists = true;
    } catch {
      // File doesn't exist
    }

    // If ccr didn't create the result file, write stdout as fallback
    if (!exists) {
      const content = stdout?.trim();
      if (!content) {
        throw new Error("ccr did not produce a result file or any stdout to save");
      }
      await fs.writeFile(resultPath, content, "utf8");
    }

    // Return the absolute path to the result file
    return {
      content: [
        { type: "text", text: path.resolve(resultPath) },
        { type: "text", text: `log: ${path.resolve(latestLogPath)}` },
        { type: "text", text: `log_ts: ${path.resolve(logPath)}` },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Error handling for process
  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });

  // Keep the process alive and log unexpected errors instead of exiting
  process.on("uncaughtException", (err) => {
    console.error("Uncaught exception:", err);
  });
  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection:", reason);
  });
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});

