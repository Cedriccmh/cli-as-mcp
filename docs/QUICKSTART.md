# Quick Start Guide

Get started with CLI-as-MCP in 5 minutes!

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/cli-as-mcp.git
cd cli-as-mcp

# Install dependencies
pip install -r requirements.txt

# Or install in editable mode for development
pip install -e .
```

## Your First MCP Server

### Step 1: Create a Configuration

Create a file `my-cli.json`:

```json
{
  "name": "echo-server",
  "command": "echo",
  "description": "Simple echo server",
  "tools": [
    {
      "name": "say_hello",
      "description": "Say hello to someone",
      "parameters": {
        "name": {
          "type": "string",
          "description": "Name to greet",
          "required": true
        }
      },
      "command_template": "echo 'Hello, {name}!'"
    }
  ]
}
```

### Step 2: Start the Server

```bash
python -m cli_as_mcp serve --config my-cli.json
```

### Step 3: Connect from Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on Mac):

```json
{
  "mcpServers": {
    "echo-server": {
      "command": "python",
      "args": [
        "-m",
        "cli_as_mcp",
        "serve",
        "--config",
        "/absolute/path/to/my-cli.json"
      ]
    }
  }
}
```

### Step 4: Use in Claude

In Claude Desktop, you can now use the tool:

```
Can you say hello to Alice using the echo server?
```

Claude will call your MCP server, which will execute `echo 'Hello, Alice!'`

## Real-World Example: Claude CLI

Here's a practical example using the Claude CLI tool:

### 1. Configure Claude CLI as MCP

```json
{
  "name": "claude-cli",
  "command": "claude",
  "description": "Claude Code CLI as MCP server",
  "tools": [
    {
      "name": "run_task",
      "description": "Execute a Claude CLI task from a markdown file",
      "parameters": {
        "task_path": {
          "type": "string",
          "description": "Path to the task markdown file"
        }
      },
      "command_template": "claude --dangerously-skip-permissions \"prompt path {task_path}\"",
      "timeout": 300
    }
  ]
}
```

### 2. Start the Server

```bash
python -m cli_as_mcp serve --config configs/claude-cli.json
```

### 3. Use from Claude Desktop

Now Claude can execute tasks from markdown files:

```
Please run the task in .claude-tasks/tasks/pending/search-auth.md
```

## Template Syntax

CLI-as-MCP supports powerful template syntax:

### Simple Placeholders

```json
"command_template": "git commit -m '{message}'"
```

### Conditional Blocks

```json
"command_template": "npm install {package}{#if dev} --save-dev{/if}"
```

### Multiple Parameters

```json
"command_template": "git log -n {limit} --author '{author}'"
```

## Common Patterns

### Pattern 1: Git Operations

```json
{
  "name": "git-helper",
  "command": "git",
  "tools": [
    {
      "name": "commit",
      "parameters": {
        "message": {"type": "string", "required": true}
      },
      "command_template": "git commit -m '{message}'"
    },
    {
      "name": "status",
      "parameters": {},
      "command_template": "git status"
    }
  ]
}
```

### Pattern 2: Package Managers

```json
{
  "name": "npm-helper",
  "command": "npm",
  "tools": [
    {
      "name": "install",
      "parameters": {
        "package": {"type": "string", "required": true},
        "dev": {"type": "boolean", "default": false}
      },
      "command_template": "npm install {package}{#if dev} --save-dev{/if}"
    }
  ]
}
```

### Pattern 3: Custom Scripts

```json
{
  "name": "deploy-helper",
  "command": "./scripts/deploy.sh",
  "tools": [
    {
      "name": "deploy",
      "parameters": {
        "environment": {"type": "string", "required": true},
        "skip_tests": {"type": "boolean", "default": false}
      },
      "command_template": "./scripts/deploy.sh {environment}{#if skip_tests} --skip-tests{/if}"
    }
  ]
}
```

## Tips & Tricks

### 1. Use Absolute Paths

When configuring Claude Desktop, use absolute paths:

```json
"args": ["-m", "cli_as_mcp", "serve", "--config", "/Users/you/project/config.json"]
```

### 2. Set Working Directory

Control where commands execute:

```json
{
  "name": "project-cli",
  "working_directory": "/path/to/project",
  "tools": [...]
}
```

### 3. Environment Variables

Pass environment variables to commands:

```json
{
  "name": "api-cli",
  "environment": {
    "API_KEY": "${ENV:MY_API_KEY}",
    "DEBUG": "true"
  }
}
```

### 4. Increase Timeout for Long Commands

```json
{
  "name": "build",
  "command_template": "npm run build",
  "timeout": 600
}
```

## Next Steps

- Check out [examples/](../examples/) for more usage patterns
- Read the full [README.md](../README.md) for advanced features
- See [configs/](../configs/) for complete configuration examples
- Read [CONTRIBUTING.md](../CONTRIBUTING.md) to contribute

## Troubleshooting

### Server Won't Start

- Check that the config file path is correct
- Verify JSON syntax is valid
- Ensure the base command exists in PATH

### Tool Execution Fails

- Check command template syntax
- Verify all required parameters are provided
- Increase timeout for long-running commands
- Check working directory is correct

### Claude Desktop Can't Connect

- Use absolute paths in configuration
- Restart Claude Desktop after config changes
- Check server logs for errors

## Getting Help

- [GitHub Issues](https://github.com/yourusername/cli-as-mcp/issues)
- [Discussions](https://github.com/yourusername/cli-as-mcp/discussions)
- Check existing configs in `configs/` directory

