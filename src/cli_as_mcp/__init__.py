"""CLI-as-MCP: Transform any CLI tool into an MCP server."""

__version__ = "0.1.0"
__author__ = "Your Name"
__license__ = "MIT"

from .server import MCPServer
from .config import CLIConfig, ToolConfig, ResourceConfig

__all__ = ["MCPServer", "CLIConfig", "ToolConfig", "ResourceConfig"]

