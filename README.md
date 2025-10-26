# Scouts MCP Server

A Model Context Protocol (MCP) server that exposes the `scouts_search` tool, which wraps the `ccr code` CLI to process task files and generate results.

## Overview

This MCP server provides a single tool:
- **scouts_search**: Takes a task file path, runs `ccr code` on it, and returns the path to the generated `result.md` file.

## Prerequisites

- **Node.js** ≥ 18
- **ccr** CLI tool must be installed and available on your PATH
  - Test with: `ccr --version` or `ccr code --help`
  - If `ccr` is in a custom location, set the `CCR_PATH` environment variable

## Installation

```bash
npm install
```

## Usage

### Development Mode

Run the server in development mode (useful for testing):

```bash
npm run dev
```

### Production Build

Build the TypeScript to JavaScript:

```bash
npm run build
```

The compiled output will be in the `dist/` directory.

### Running as MCP Server

The server uses stdio transport, so it's designed to be spawned by an MCP client (like Claude Desktop or other MCP-compatible applications).

Add to your MCP client configuration (e.g., `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "scouts": {
      "command": "node",
      "args": ["/absolute/path/to/scouts-mcp/dist/server.js"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "scouts": {
      "command": "scouts-mcp"
    }
  }
}
```

## Tool: scouts_search

### Input

- `taskPath` (string, required): Absolute or relative path to the task.md file

### Behavior

1. Resolves the absolute path to the task file
2. Runs: `ccr code --dangerously-skip-permissions 'task file <taskPath>'`
3. Checks if `result.md` was created in the same directory as the task file
4. If `result.md` doesn't exist, writes ccr's stdout to `result.md` as a fallback
5. Returns the absolute path to `result.md`

### Output

Returns a text response containing the absolute path to the generated `result.md` file.

### Example

If you have a task file at `.kilocode/sub-memory-bank/tasks/2025-10-25-example.md`, the tool will:
- Run ccr on that file
- Generate `.kilocode/sub-memory-bank/tasks/result.md`
- Return the full path to `result.md`

## Environment Variables

- `CCR_PATH`: Custom path to the `ccr` executable (defaults to `ccr` on PATH). If you wrap it in quotes in your config, the server strips them automatically. For testing, you can point this to the dummy script (e.g., `C:\path\to\scripts\ccr-dummy.ps1`).
- `CCR_TIMEOUT_MS`: Timeout in milliseconds for ccr execution (default: 600000 = 10 minutes). Set to a shorter value like 30000 (30 seconds) for faster feedback during testing.

## Error Handling

The tool will return an error if:
- The `ccr` command is not found
- The `ccr` process exits with a non-zero code
- The `ccr` process doesn't create `result.md` and doesn't output anything to stdout

## Project Structure

```
cli-as-mcp/
├── src/
│   └── server.ts           # Main MCP server implementation
├── dist/                   # Compiled JavaScript (after build)
├── scripts/
│   ├── ccr-dummy.js        # Node.js dummy CCR for testing
│   └── ccr-dummy.ps1       # PowerShell dummy CCR for testing
├── tests/
│   ├── test-mcp-server.js  # MCP protocol tests
│   ├── test-mcp-server-real.js # Real CCR integration tests
│   ├── run-direct.cjs      # Direct CCR invocation tool
│   └── README.md           # Test documentation
├── docs/
│   ├── DEVELOPMENT.md      # Development guide
│   ├── TESTING.md          # Testing guide
│   ├── TROUBLESHOOTING.md  # Troubleshooting guide
│   ├── USAGE.md            # Usage guide
│   ├── scouts-system-prompt.md # Scouts system documentation
│   └── TEST-REPORT.md      # Test report
├── package.json
├── tsconfig.json
└── README.md
```

## Development

The server is implemented using:
- `@modelcontextprotocol/sdk` for MCP protocol
- `zod` for input validation
- Node.js `child_process.spawn` for secure ccr invocation

For detailed development information, see:
- [Development Guide](docs/DEVELOPMENT.md)
- [Testing Guide](docs/TESTING.md)
- [Usage Guide](docs/USAGE.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## Platform Notes

- **Windows**: The spawn implementation uses an args array (no shell), so paths with spaces are handled safely
- **Unix**: Same approach works cross-platform
- **Security**: The `--dangerously-skip-permissions` flag is passed to ccr as required; ensure you trust the task files being processed

## License

MIT

