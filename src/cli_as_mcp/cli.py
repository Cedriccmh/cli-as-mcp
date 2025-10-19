"""CLI interface for CLI-as-MCP."""

import asyncio
import logging
from pathlib import Path

import click

from .server import create_server


@click.group()
@click.version_option()
def main() -> None:
    """CLI-as-MCP: Transform any CLI tool into an MCP server."""
    pass


@main.command()
@click.option(
    "--config",
    "-c",
    type=click.Path(exists=True, path_type=Path),
    required=True,
    help="Path to configuration file",
)
@click.option(
    "--log-level",
    type=click.Choice(["DEBUG", "INFO", "WARNING", "ERROR"]),
    default="INFO",
    help="Logging level",
)
def serve(config: Path, log_level: str) -> None:
    """Start the MCP server."""
    # Configure logging
    logging.basicConfig(
        level=getattr(logging, log_level),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    # Create and run server
    server = create_server(config)
    asyncio.run(server.run())


@main.command()
@click.argument("name")
@click.option(
    "--command",
    "-c",
    required=True,
    help="Base CLI command",
)
@click.option(
    "--description",
    "-d",
    default="",
    help="CLI tool description",
)
@click.option(
    "--output",
    "-o",
    type=click.Path(path_type=Path),
    required=True,
    help="Output configuration file path",
)
def init(name: str, command: str, description: str, output: Path) -> None:
    """Initialize a new CLI-as-MCP configuration."""
    from .config import CLIConfig

    config = CLIConfig(
        name=name,
        command=command,
        description=description or f"{name} as MCP server",
    )

    config.to_file(output)
    click.echo(f"Configuration created at: {output}")
    click.echo("\nNext steps:")
    click.echo("1. Edit the configuration to add tools and resources")
    click.echo(f"2. Start the server: cli-as-mcp serve --config {output}")


if __name__ == "__main__":
    main()

