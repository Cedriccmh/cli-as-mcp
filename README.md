# CLI-as-MCP

> Transform any CLI tool into an MCP (Model Context Protocol) server

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 What is this?

**CLI-as-MCP** is a lightweight bridge that converts command-line interface (CLI) tools into MCP servers, making them accessible to AI assistants like Claude through the Model Context Protocol.

Instead of building custom MCP servers for every tool, simply wrap your existing CLI tools and expose them as MCP resources and tools.

### Example Use Case

```bash
# Traditional CLI usage
claude --dangerously-skip-permissions "prompt path .claude-tasks/tasks/pending/search-topic.md"

# With CLI-as-MCP
# Your AI assistant can invoke this as an MCP tool automatically!
```

## 🚀 Quick Start

### Prerequisites

- Python 3.10 or higher
- The CLI tool you want to wrap (e.g., `claude`, `git`, `npm`, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/cli-as-mcp.git
cd cli-as-mcp

# Install dependencies
pip install -r requirements.txt

# Or using Poetry
poetry install
```

### Basic Usage

1. **Create a configuration file** for your CLI tool:

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
      "command_template": "claude --dangerously-skip-permissions \"prompt path {task_path}\""
    }
  ]
}
```

2. **Start the MCP server**:

```bash
python -m cli_as_mcp serve --config configs/claude-cli.json
```

3. **Connect from Claude Desktop** or any MCP client:

```json
{
  "mcpServers": {
    "claude-cli": {
      "command": "python",
      "args": ["-m", "cli_as_mcp", "serve", "--config", "configs/claude-cli.json"]
    }
  }
}
```

## 📚 Features

- ✅ **Zero-code CLI wrapping** - Just write a JSON config
- ✅ **Template-based commands** - Dynamic parameter substitution
- ✅ **Streaming output** - Real-time command execution feedback
- ✅ **Error handling** - Graceful failures with detailed error messages
- ✅ **Multi-tool support** - Expose multiple CLI operations as separate MCP tools
- ✅ **Resource exposure** - Make CLI outputs available as MCP resources
- ✅ **Environment variable support** - Secure credential management

## 🏗️ Architecture

```
┌─────────────────┐
│  AI Assistant   │
│   (Claude)      │
└────────┬────────┘
         │ MCP Protocol
         │
┌────────▼────────┐
│  CLI-as-MCP     │
│   Bridge        │
└────────┬────────┘
         │ Command Execution
         │
┌────────▼────────┐
│   CLI Tool      │
│  (claude, etc)  │
└─────────────────┘
```

## 📖 Configuration Guide

### Basic Configuration

```json
{
  "name": "my-cli-tool",
  "command": "my-tool",
  "description": "My CLI tool as MCP server",
  "tools": [
    {
      "name": "execute",
      "description": "Execute a command",
      "parameters": {
        "arg1": {
          "type": "string",
          "description": "First argument"
        }
      },
      "command_template": "my-tool {arg1}"
    }
  ]
}
```

### Advanced Configuration

```json
{
  "name": "advanced-cli",
  "command": "advanced-tool",
  "description": "Advanced CLI tool with multiple operations",
  "environment": {
    "API_KEY": "${ENV:API_KEY}",
    "LOG_LEVEL": "debug"
  },
  "tools": [
    {
      "name": "search",
      "description": "Search for items",
      "parameters": {
        "query": {
          "type": "string",
          "description": "Search query"
        },
        "limit": {
          "type": "integer",
          "description": "Max results",
          "default": 10
        }
      },
      "command_template": "advanced-tool search --query '{query}' --limit {limit}",
      "output_format": "json"
    }
  ],
  "resources": [
    {
      "uri": "config://settings",
      "name": "Configuration",
      "description": "Current tool configuration",
      "command": "advanced-tool config --show"
    }
  ]
}
```

## 🔧 Examples

### Example 1: Git as MCP

```json
{
  "name": "git-mcp",
  "command": "git",
  "description": "Git CLI as MCP server",
  "tools": [
    {
      "name": "git_status",
      "description": "Get git repository status",
      "parameters": {},
      "command_template": "git status"
    },
    {
      "name": "git_commit",
      "description": "Create a git commit",
      "parameters": {
        "message": {
          "type": "string",
          "description": "Commit message"
        }
      },
      "command_template": "git commit -m '{message}'"
    }
  ]
}
```

### Example 2: Claude CLI as MCP

See `configs/claude-cli.json` for a complete working example.

### Example 3: NPM as MCP

```json
{
  "name": "npm-mcp",
  "command": "npm",
  "description": "NPM CLI as MCP server",
  "tools": [
    {
      "name": "npm_install",
      "description": "Install a package",
      "parameters": {
        "package": {
          "type": "string",
          "description": "Package name"
        },
        "dev": {
          "type": "boolean",
          "description": "Install as dev dependency",
          "default": false
        }
      },
      "command_template": "npm install {package}{#if dev} --save-dev{/if}"
    }
  ]
}
```

## 🧪 Development

### Project Structure

```
cli-as-mcp/
├── src/
│   └── cli_as_mcp/
│       ├── __init__.py
│       ├── server.py          # MCP server implementation
│       ├── cli_wrapper.py     # CLI execution logic
│       ├── config.py          # Configuration handling
│       └── templates.py       # Command template engine
├── configs/                   # Example configurations
│   ├── claude-cli.json
│   ├── git.json
│   └── npm.json
├── examples/                  # Usage examples
│   └── basic_usage.py
├── tests/                     # Test suite
│   ├── test_server.py
│   └── test_wrapper.py
├── docs/                      # Documentation
│   └── advanced-usage.md
├── pyproject.toml            # Python project config
├── requirements.txt          # Dependencies
├── .gitignore
└── README.md
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=cli_as_mcp

# Run specific test
pytest tests/test_server.py
```

### Building from Source

```bash
# Install in development mode
pip install -e .

# Build package
python -m build

# Install from built package
pip install dist/cli_as_mcp-*.whl
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) by Anthropic
- [Claude CLI](https://github.com/anthropics/claude-cli) for inspiration
- All the CLI tools that make this useful!

## 🔗 Related Projects

- [MCP Servers](https://github.com/modelcontextprotocol/servers) - Official MCP servers
- [Claude CLI](https://github.com/anthropics/claude-cli) - Claude's official CLI

## 📬 Support

- 🐛 [Report a Bug](https://github.com/yourusername/cli-as-mcp/issues)
- 💡 [Request a Feature](https://github.com/yourusername/cli-as-mcp/issues)
- 💬 [Discussions](https://github.com/yourusername/cli-as-mcp/discussions)

---

**Made with ❤️ for the AI developer community**

