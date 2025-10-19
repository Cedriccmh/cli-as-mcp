# Examples

This document provides practical examples of using CLI-as-MCP with various CLI tools.

## Table of Contents

- [Claude CLI](#claude-cli)
- [Git](#git)
- [NPM](#npm)
- [Docker](#docker)
- [Custom Scripts](#custom-scripts)
- [Advanced Patterns](#advanced-patterns)

---

## Claude CLI

### Basic Task Execution

**Configuration:**
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

**Usage in Claude:**
```
Please run the task at .claude-tasks/tasks/pending/search-auth.md
```

### Codebase Search

```json
{
  "name": "search_codebase",
  "description": "Search the codebase for a topic",
  "parameters": {
    "topic": {
      "type": "string",
      "description": "Topic to search for"
    }
  },
  "command_template": "echo '/tr:withScout\n\n# Search for {topic}\n\nFind all code related to {topic}' | claude --dangerously-skip-permissions"
}
```

---

## Git

### Complete Git Helper

**Configuration:**
```json
{
  "name": "git-mcp",
  "command": "git",
  "description": "Git operations as MCP server",
  "tools": [
    {
      "name": "status",
      "description": "Get repository status",
      "parameters": {},
      "command_template": "git status"
    },
    {
      "name": "commit",
      "description": "Create a commit",
      "parameters": {
        "message": {
          "type": "string",
          "description": "Commit message",
          "required": true
        },
        "amend": {
          "type": "boolean",
          "description": "Amend previous commit",
          "default": false
        }
      },
      "command_template": "git commit -m '{message}'{#if amend} --amend{/if}"
    },
    {
      "name": "push",
      "description": "Push commits to remote",
      "parameters": {
        "remote": {
          "type": "string",
          "description": "Remote name",
          "default": "origin"
        },
        "branch": {
          "type": "string",
          "description": "Branch name",
          "required": true
        },
        "force": {
          "type": "boolean",
          "description": "Force push",
          "default": false
        }
      },
      "command_template": "git push {remote} {branch}{#if force} --force{/if}"
    }
  ],
  "resources": [
    {
      "uri": "git://log",
      "name": "Recent Commits",
      "description": "Last 10 commits",
      "command": "git log -n 10 --oneline"
    }
  ]
}
```

---

## NPM

### Package Management

**Configuration:**
```json
{
  "name": "npm-mcp",
  "command": "npm",
  "description": "NPM package manager",
  "tools": [
    {
      "name": "install",
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
        },
        "global": {
          "type": "boolean",
          "description": "Install globally",
          "default": false
        }
      },
      "command_template": "npm install{#if global} -g{/if} {package}{#if dev} --save-dev{/if}"
    },
    {
      "name": "run_script",
      "description": "Run an npm script",
      "parameters": {
        "script": {
          "type": "string",
          "description": "Script name"
        }
      },
      "command_template": "npm run {script}"
    }
  ]
}
```

---

## Docker

### Container Management

**Configuration:**
```json
{
  "name": "docker-mcp",
  "command": "docker",
  "description": "Docker container management",
  "tools": [
    {
      "name": "list_containers",
      "description": "List running containers",
      "parameters": {
        "all": {
          "type": "boolean",
          "description": "Show all containers (including stopped)",
          "default": false
        }
      },
      "command_template": "docker ps{#if all} -a{/if}"
    },
    {
      "name": "start_container",
      "description": "Start a container",
      "parameters": {
        "container": {
          "type": "string",
          "description": "Container name or ID"
        }
      },
      "command_template": "docker start {container}"
    },
    {
      "name": "logs",
      "description": "View container logs",
      "parameters": {
        "container": {
          "type": "string",
          "description": "Container name or ID"
        },
        "tail": {
          "type": "integer",
          "description": "Number of lines to show",
          "default": 100
        }
      },
      "command_template": "docker logs --tail {tail} {container}"
    }
  ]
}
```

---

## Custom Scripts

### Deployment Script

**Configuration:**
```json
{
  "name": "deploy-mcp",
  "command": "./scripts/deploy.sh",
  "description": "Deployment automation",
  "working_directory": "/path/to/project",
  "environment": {
    "DEPLOY_KEY": "${ENV:DEPLOY_KEY}"
  },
  "tools": [
    {
      "name": "deploy",
      "description": "Deploy to environment",
      "parameters": {
        "environment": {
          "type": "string",
          "description": "Target environment (dev/staging/prod)"
        },
        "version": {
          "type": "string",
          "description": "Version to deploy",
          "default": "latest"
        },
        "skip_tests": {
          "type": "boolean",
          "description": "Skip running tests",
          "default": false
        }
      },
      "command_template": "./scripts/deploy.sh {environment} {version}{#if skip_tests} --skip-tests{/if}",
      "timeout": 600
    }
  ]
}
```

---

## Advanced Patterns

### Multi-Command Workflow

Combine multiple operations into one tool:

```json
{
  "name": "release",
  "description": "Create a new release",
  "parameters": {
    "version": {
      "type": "string",
      "description": "Version number"
    }
  },
  "command_template": "npm version {version} && git push && git push --tags && npm publish",
  "timeout": 120
}
```

### Environment-Specific Commands

Use environment variables to customize commands:

```json
{
  "name": "api-client",
  "command": "curl",
  "environment": {
    "API_URL": "${ENV:API_URL}",
    "API_KEY": "${ENV:API_KEY}"
  },
  "tools": [
    {
      "name": "get_data",
      "parameters": {
        "endpoint": {
          "type": "string",
          "description": "API endpoint"
        }
      },
      "command_template": "curl -H 'Authorization: Bearer $API_KEY' $API_URL/{endpoint}"
    }
  ]
}
```

### Resource Monitoring

Expose system resources:

```json
{
  "name": "system-monitor",
  "command": "bash",
  "resources": [
    {
      "uri": "system://disk-usage",
      "name": "Disk Usage",
      "description": "Current disk usage",
      "command": "df -h"
    },
    {
      "uri": "system://memory",
      "name": "Memory Usage",
      "description": "Current memory usage",
      "command": "free -h"
    },
    {
      "uri": "system://processes",
      "name": "Top Processes",
      "description": "Top CPU-consuming processes",
      "command": "ps aux --sort=-%cpu | head -n 10"
    }
  ]
}
```

### Conditional Flags

Complex conditional logic:

```json
{
  "name": "build",
  "description": "Build the project",
  "parameters": {
    "mode": {
      "type": "string",
      "description": "Build mode"
        },
    "minify": {
      "type": "boolean",
      "default": false
    },
    "sourcemaps": {
      "type": "boolean",
      "default": true
    }
  },
  "command_template": "npm run build -- --mode {mode}{#if minify} --minify{/if}{#if sourcemaps} --sourcemaps{/if}"
}
```

---

## Tips for Creating Configurations

1. **Start Simple**: Begin with basic commands, add complexity as needed
2. **Use Defaults**: Provide sensible defaults for optional parameters
3. **Set Timeouts**: Adjust timeouts based on expected command duration
4. **Test Locally**: Test commands in terminal before adding to config
5. **Document Parameters**: Write clear parameter descriptions
6. **Handle Errors**: Consider what happens when commands fail
7. **Security**: Use environment variables for sensitive data

---

## More Examples

Check the `configs/` directory for complete working examples:

- `configs/claude-cli.json` - Claude CLI integration
- `configs/git.json` - Git operations
- `configs/npm.json` - NPM package management

For programmatic examples, see:

- `examples/basic_usage.py` - Basic usage
- `examples/custom_config.py` - Creating configs programmatically

