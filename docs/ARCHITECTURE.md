# Architecture

This document describes the architecture of CLI-as-MCP.

## Overview

CLI-as-MCP is a bridge that wraps command-line tools and exposes them as MCP (Model Context Protocol) servers. It allows AI assistants to interact with any CLI tool through a standardized protocol.

## Components

### 1. Configuration Layer (`config.py`)

Handles configuration loading and validation using Pydantic models.

**Key Classes:**
- `CLIConfig`: Main configuration container
- `ToolConfig`: Tool definition with parameters and command template
- `ResourceConfig`: Resource definition for exposing CLI outputs
- `ParameterConfig`: Parameter metadata and validation

**Responsibilities:**
- Load configuration from JSON files
- Validate configuration structure
- Provide type-safe access to configuration

### 2. Template Engine (`templates.py`)

Renders command templates with user-provided parameters.

**Features:**
- Simple placeholder substitution: `{param}`
- Conditional blocks: `{#if param}...{/if}`
- Boolean flag support

**Example:**
```python
template = "git commit -m '{message}'{#if amend} --amend{/if}"
params = {"message": "fix bug", "amend": True}
result = render_template(template, params)
# Result: "git commit -m 'fix bug' --amend"
```

### 3. CLI Wrapper (`cli_wrapper.py`)

Executes CLI commands asynchronously with proper error handling.

**Key Class:** `CLIWrapper`

**Responsibilities:**
- Execute commands in subprocess
- Handle timeouts
- Resolve environment variables
- Stream command output
- Return structured results

**Features:**
- Async execution using `asyncio`
- Timeout support
- Environment variable resolution (including `${ENV:VAR}` syntax)
- Working directory support

### 4. MCP Server (`server.py`)

Implements the Model Context Protocol server interface.

**Key Class:** `MCPServer`

**MCP Operations:**
- `list_tools()`: List available CLI tools
- `call_tool()`: Execute a CLI tool with parameters
- `list_resources()`: List available resources
- `read_resource()`: Fetch resource content

**Flow:**
1. Register handlers for MCP operations
2. Convert CLI config to MCP tool/resource definitions
3. Handle incoming tool calls
4. Execute commands via CLIWrapper
5. Return formatted results

### 5. CLI Interface (`cli.py`)

Command-line interface for managing the server.

**Commands:**
- `serve`: Start an MCP server from a config file
- `init`: Initialize a new configuration file

## Data Flow

```
┌─────────────────┐
│  AI Assistant   │
│   (Claude)      │
└────────┬────────┘
         │
         │ MCP Protocol
         │ (stdio/JSON-RPC)
         │
┌────────▼────────┐
│   MCP Server    │  ← server.py
│   (server.py)   │
└────────┬────────┘
         │
         │ Tool Call
         │
┌────────▼────────┐
│  CLI Wrapper    │  ← cli_wrapper.py
│ (cli_wrapper.py)│
└────────┬────────┘
         │
         │ Template Rendering
         │
┌────────▼────────┐
│ Template Engine │  ← templates.py
│ (templates.py)  │
└────────┬────────┘
         │
         │ Rendered Command
         │
┌────────▼────────┐
│   Subprocess    │
│   (CLI Tool)    │
└─────────────────┘
```

## Execution Flow

### Tool Execution

1. **Request**: AI assistant calls tool via MCP
   ```json
   {
     "name": "git_commit",
     "arguments": {"message": "fix bug"}
   }
   ```

2. **Lookup**: Server finds matching `ToolConfig`

3. **Template Rendering**: Replace placeholders in command template
   ```
   "git commit -m '{message}'" → "git commit -m 'fix bug'"
   ```

4. **Execution**: CLIWrapper runs command in subprocess
   ```python
   await asyncio.create_subprocess_shell(...)
   ```

5. **Response**: Return formatted result to AI assistant
   ```json
   {
     "success": true,
     "output": "[main abc123] fix bug",
     "exit_code": 0
   }
   ```

### Resource Reading

1. **Request**: AI assistant requests resource
   ```
   URI: git://status
   ```

2. **Lookup**: Server finds matching `ResourceConfig`

3. **Execution**: Run resource command
   ```
   "git status" → subprocess
   ```

4. **Response**: Return command output as resource content

## Configuration Schema

```json
{
  "name": "string",              // MCP server name
  "command": "string",           // Base CLI command
  "description": "string",       // Server description
  "working_directory": "string", // Optional working dir
  "environment": {               // Environment variables
    "KEY": "value"
  },
  "tools": [                     // Available tools
    {
      "name": "string",
      "description": "string",
      "parameters": {
        "param_name": {
          "type": "string|integer|boolean",
          "description": "string",
          "required": true,
          "default": any
        }
      },
      "command_template": "string",
      "timeout": 30
    }
  ],
  "resources": [                 // Available resources
    {
      "uri": "string",
      "name": "string",
      "description": "string",
      "command": "string",
      "mime_type": "string"
    }
  ]
}
```

## Extension Points

### 1. Custom Template Functions

Extend `templates.py` to support new template syntax:

```python
def render_template(template: str, parameters: Dict[str, Any]) -> str:
    # Add new patterns here
    pass
```

### 2. Output Formatters

Add output formatting in `cli_wrapper.py`:

```python
def format_output(output: str, format_type: str) -> Any:
    if format_type == "json":
        return json.loads(output)
    elif format_type == "yaml":
        return yaml.safe_load(output)
    return output
```

### 3. Authentication Handlers

Add authentication support in `cli_wrapper.py`:

```python
def prepare_auth(self, auth_config: Dict) -> Dict[str, str]:
    # Add auth headers/env vars
    pass
```

### 4. Custom Validators

Add parameter validation in `config.py`:

```python
class ParameterConfig(BaseModel):
    @validator('value')
    def validate_value(cls, v):
        # Custom validation logic
        return v
```

## Security Considerations

### 1. Command Injection

- Parameters are passed to subprocess, not shell-interpolated
- Template rendering doesn't use `eval()`
- User input should still be validated

### 2. Environment Variables

- Sensitive data can use `${ENV:VAR}` to avoid hardcoding
- Environment variables are resolved at runtime
- Don't log environment variable values

### 3. Working Directory

- Commands execute in specified working directory
- Prevents access to unintended files
- Should be validated in production

### 4. Timeouts

- All commands have configurable timeouts
- Prevents hanging processes
- Default: 30 seconds

## Performance

### Async Execution

All command execution is asynchronous using `asyncio`, allowing:
- Multiple concurrent tool calls
- Non-blocking I/O
- Efficient resource usage

### Process Management

- Each command runs in a subprocess
- Output is streamed (stdout/stderr)
- Processes are properly cleaned up on timeout

## Error Handling

### Levels

1. **Configuration Errors**: Caught at startup
2. **Template Errors**: Caught during rendering
3. **Execution Errors**: Caught during subprocess execution
4. **Timeout Errors**: Caught via `asyncio.wait_for()`

### Error Response Format

```python
{
    "success": False,
    "output": "",
    "error": "Error message",
    "exit_code": -1
}
```

## Testing Strategy

### Unit Tests

- Configuration loading/validation
- Template rendering
- Environment variable resolution

### Integration Tests

- End-to-end tool execution
- MCP protocol compliance
- Error handling

### Test Structure

```
tests/
├── test_config.py       # Configuration tests
├── test_templates.py    # Template engine tests
├── test_wrapper.py      # CLI wrapper tests
└── test_server.py       # MCP server tests
```

## Future Enhancements

1. **Streaming Output**: Real-time command output streaming
2. **Interactive Commands**: Support for commands requiring input
3. **File Upload/Download**: Transfer files to/from CLI tools
4. **Plugin System**: Extensible architecture for custom handlers
5. **Caching**: Cache command results for repeated calls
6. **Rate Limiting**: Prevent abuse of CLI tools
7. **Audit Logging**: Track all command executions

