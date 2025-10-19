"""Tests for configuration handling."""

import json
from pathlib import Path
import pytest

from cli_as_mcp.config import CLIConfig, ToolConfig, ParameterConfig


def test_parameter_config():
    """Test parameter configuration."""
    param = ParameterConfig(
        type="string",
        description="Test parameter",
        default="default_value",
        required=False,
    )

    assert param.type == "string"
    assert param.description == "Test parameter"
    assert param.default == "default_value"
    assert param.required is False


def test_tool_config():
    """Test tool configuration."""
    tool = ToolConfig(
        name="test_tool",
        description="A test tool",
        parameters={
            "arg1": ParameterConfig(
                type="string",
                description="First argument",
            )
        },
        command_template="test {arg1}",
    )

    assert tool.name == "test_tool"
    assert tool.description == "A test tool"
    assert "arg1" in tool.parameters
    assert tool.command_template == "test {arg1}"
    assert tool.timeout == 30  # default


def test_cli_config():
    """Test CLI configuration."""
    config = CLIConfig(
        name="test-cli",
        command="test",
        description="Test CLI",
    )

    assert config.name == "test-cli"
    assert config.command == "test"
    assert config.description == "Test CLI"
    assert len(config.tools) == 0
    assert len(config.resources) == 0


def test_cli_config_from_dict():
    """Test creating CLI config from dictionary."""
    data = {
        "name": "git-test",
        "command": "git",
        "description": "Git test",
        "tools": [
            {
                "name": "status",
                "description": "Git status",
                "parameters": {},
                "command_template": "git status",
            }
        ],
    }

    config = CLIConfig(**data)

    assert config.name == "git-test"
    assert len(config.tools) == 1
    assert config.tools[0].name == "status"


def test_cli_config_file_operations(tmp_path):
    """Test saving and loading configuration from file."""
    config_file = tmp_path / "test_config.json"

    # Create config
    config = CLIConfig(
        name="file-test",
        command="echo",
        description="File test",
        tools=[
            ToolConfig(
                name="echo",
                description="Echo test",
                parameters={},
                command_template="echo test",
            )
        ],
    )

    # Save to file
    config.to_file(config_file)

    assert config_file.exists()

    # Load from file
    loaded_config = CLIConfig.from_file(config_file)

    assert loaded_config.name == config.name
    assert loaded_config.command == config.command
    assert len(loaded_config.tools) == len(config.tools)

