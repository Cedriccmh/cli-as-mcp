"""Basic usage example for CLI-as-MCP."""

import asyncio
from pathlib import Path

from cli_as_mcp import CLIConfig, MCPServer


async def main():
    """Demonstrate basic usage of CLI-as-MCP."""
    # Load configuration from file
    config_path = Path(__file__).parent.parent / "configs" / "git.json"
    config = CLIConfig.from_file(config_path)

    print(f"Loaded configuration for: {config.name}")
    print(f"Description: {config.description}")
    print(f"Number of tools: {len(config.tools)}")
    print(f"Number of resources: {len(config.resources)}")

    # Create server
    server = MCPServer(config)

    # In production, you would run the server like this:
    # await server.run()

    print("\nTo run the server:")
    print(f"  cli-as-mcp serve --config {config_path}")


if __name__ == "__main__":
    asyncio.run(main())

