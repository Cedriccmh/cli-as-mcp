"""Example of creating a custom configuration programmatically."""

from pathlib import Path

from cli_as_mcp import CLIConfig, ToolConfig, ParameterConfig


def create_custom_config():
    """Create a custom CLI-as-MCP configuration."""
    # Define a tool
    tool = ToolConfig(
        name="echo_message",
        description="Echo a message to stdout",
        parameters={
            "message": ParameterConfig(
                type="string",
                description="Message to echo",
                required=True,
            ),
            "uppercase": ParameterConfig(
                type="boolean",
                description="Convert to uppercase",
                default=False,
                required=False,
            ),
        },
        command_template="echo '{message}'{#if uppercase} | tr '[:lower:]' '[:upper:]'{/if}",
        timeout=5,
    )

    # Create configuration
    config = CLIConfig(
        name="echo-cli",
        command="echo",
        description="Echo command as MCP server",
        tools=[tool],
    )

    # Save to file
    output_path = Path(__file__).parent.parent / "configs" / "echo.json"
    config.to_file(output_path)

    print(f"Configuration saved to: {output_path}")
    print("\nConfiguration contents:")
    print(config.model_dump_json(indent=2))


if __name__ == "__main__":
    create_custom_config()

