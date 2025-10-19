"""MCP server implementation for CLI tools."""

import asyncio
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from mcp.server import Server
from mcp.types import Resource, Tool, TextContent

from .cli_wrapper import CLIWrapper
from .config import CLIConfig

logger = logging.getLogger(__name__)


class MCPServer:
    """MCP server that wraps a CLI tool."""

    def __init__(self, config: CLIConfig):
        """Initialize the MCP server.

        Args:
            config: CLI configuration
        """
        self.config = config
        self.server = Server(config.name)
        self.wrapper = CLIWrapper(
            base_command=config.command,
            working_directory=config.working_directory,
            environment=config.environment,
        )

        # Register handlers
        self._register_handlers()

    def _register_handlers(self) -> None:
        """Register MCP server handlers."""

        @self.server.list_resources()
        async def list_resources() -> List[Resource]:
            """List available resources."""
            return [
                Resource(
                    uri=resource.uri,
                    name=resource.name,
                    description=resource.description,
                    mimeType=resource.mime_type,
                )
                for resource in self.config.resources
            ]

        @self.server.read_resource()
        async def read_resource(uri: str) -> str:
            """Read a resource by URI."""
            # Find matching resource config
            resource_config = next(
                (r for r in self.config.resources if r.uri == uri), None
            )

            if not resource_config:
                raise ValueError(f"Resource not found: {uri}")

            # Execute command to get resource content
            content = await self.wrapper.execute_resource_command(
                resource_config.command
            )

            return content

        @self.server.list_tools()
        async def list_tools() -> List[Tool]:
            """List available tools."""
            tools = []
            for tool_config in self.config.tools:
                # Convert parameters to MCP format
                input_schema = {
                    "type": "object",
                    "properties": {},
                    "required": [],
                }

                for param_name, param_config in tool_config.parameters.items():
                    input_schema["properties"][param_name] = {
                        "type": param_config.type,
                        "description": param_config.description,
                    }

                    if param_config.default is not None:
                        input_schema["properties"][param_name]["default"] = (
                            param_config.default
                        )

                    if param_config.required:
                        input_schema["required"].append(param_name)

                tools.append(
                    Tool(
                        name=tool_config.name,
                        description=tool_config.description,
                        inputSchema=input_schema,
                    )
                )

            return tools

        @self.server.call_tool()
        async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
            """Call a tool with given arguments."""
            # Find matching tool config
            tool_config = next(
                (t for t in self.config.tools if t.name == name), None
            )

            if not tool_config:
                raise ValueError(f"Tool not found: {name}")

            # Execute tool
            result = await self.wrapper.execute_tool(tool_config, arguments)

            # Format response
            if result["success"]:
                content = result["output"]
                if result["error"]:
                    content += f"\n\nStderr:\n{result['error']}"
            else:
                content = f"Error: {result['error']}"

            return [TextContent(type="text", text=content)]

    async def run(self) -> None:
        """Run the MCP server."""
        from mcp.server.stdio import stdio_server

        async with stdio_server() as (read_stream, write_stream):
            await self.server.run(
                read_stream,
                write_stream,
                self.server.create_initialization_options(),
            )


def create_server(config_path: Path) -> MCPServer:
    """Create an MCP server from a configuration file.

    Args:
        config_path: Path to configuration file

    Returns:
        Initialized MCP server
    """
    config = CLIConfig.from_file(config_path)
    return MCPServer(config)

