# Troubleshooting Guide

## MCP Server Hangs When Running scouts_search

### Problem
The MCP server hangs indefinitely when calling `scouts_search`, with no output or error messages.

### Root Cause
The server is trying to execute the real `ccr` (Claude Code CLI) command, which may:
1. Be waiting for interactive input on stdin
2. Hang due to missing environment variables or configuration
3. Have compatibility issues with the MCP subprocess environment

### Solutions

#### Solution 1: Use Dummy CCR Script for Testing (Recommended)

If you're testing or developing the MCP server and don't need the real `ccr` functionality:

1. **Update your MCP configuration** to use the dummy script:

```json
{
  "mcpServers": {
    "scouts": {
      "command": "node",
      "args": ["dist/server.js"],
      "env": {
        "CCR_PATH": "C:\\AgentProjects\\cli-as-mcp\\scripts\\ccr-dummy.ps1",
        "CCR_TIMEOUT_MS": "30000"
      }
    }
  }
}
```

2. **Adjust paths** based on your system:
   - On Windows: Use absolute path to `ccr-dummy.ps1`
   - On Linux/Mac: Use absolute path to `ccr-dummy.js` (with `node` prefix if needed)

#### Solution 2: Configure Shorter Timeout

The default timeout is 10 minutes. For faster feedback during development:

```json
{
  "mcpServers": {
    "scouts": {
      "command": "node",
      "args": ["dist/server.js"],
      "env": {
        "CCR_PATH": "C:\\Users\\YourUser\\AppData\\Roaming\\npm\\ccr.cmd",
        "CCR_TIMEOUT_MS": "30000"
      }
    }
  }
}
```

Set `CCR_TIMEOUT_MS` to 30000 (30 seconds) for testing.

#### Solution 3: Fix Real CCR Command

If you need to use the real `ccr` command:

1. **Verify ccr is properly installed**:
   ```bash
   ccr --version
   ```

2. **Check ccr works with the exact arguments**:
   ```bash
   ccr code --dangerously-skip-permissions "task file path/to/task.md"
   ```

3. **Ensure ccr doesn't require interactive input** - the MCP server closes stdin immediately to prevent hanging

4. **Check ccr output** - it should write to stdout/stderr or create the expected result file

### Code Changes Made

The following fixes were implemented in `src/server.ts`:

1. **Configurable timeout**: Added `CCR_TIMEOUT_MS` environment variable
2. **Better stdin handling**: Close stdin immediately after spawn to prevent ccr from waiting for input
3. **Improved error messages**: Timeout errors now show the actual timeout duration

### Testing

Use the provided test scripts to verify functionality:

```powershell
# Test with dummy script
.\scripts\test-with-ccr-path.ps1

# Test with real ccr (if installed)
.\scripts\test-with-real-ccr.ps1
```

### Debugging

Check the log files for detailed information:

```
.kilocode/sub-memory-bank/logs/<task-name>.latest.log
.kilocode/sub-memory-bank/logs/<task-name>.<timestamp>.log
```

The logs show:
- The exact command being executed
- Arguments passed
- Working directory
- All stdout/stderr output
- Exit code or error reason

