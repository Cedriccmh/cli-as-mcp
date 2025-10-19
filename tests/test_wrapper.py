"""Tests for CLI wrapper."""

import asyncio
import pytest

from cli_as_mcp.cli_wrapper import CLIWrapper
from cli_as_mcp.config import ToolConfig


@pytest.mark.asyncio
async def test_simple_command():
    """Test executing a simple command."""
    wrapper = CLIWrapper(base_command="echo")

    tool_config = ToolConfig(
        name="echo",
        description="Echo test",
        parameters={},
        command_template="echo hello",
    )

    result = await wrapper.execute_tool(tool_config, {})

    assert result["success"] is True
    assert "hello" in result["output"]
    assert result["exit_code"] == 0


@pytest.mark.asyncio
async def test_command_with_parameters():
    """Test executing a command with parameters."""
    wrapper = CLIWrapper(base_command="echo")

    tool_config = ToolConfig(
        name="echo",
        description="Echo test",
        parameters={},
        command_template="echo {message}",
    )

    result = await wrapper.execute_tool(tool_config, {"message": "test message"})

    assert result["success"] is True
    assert "test message" in result["output"]


@pytest.mark.asyncio
async def test_command_timeout():
    """Test command timeout."""
    wrapper = CLIWrapper(base_command="sleep")

    tool_config = ToolConfig(
        name="sleep",
        description="Sleep test",
        parameters={},
        command_template="sleep 10",
        timeout=1,
    )

    result = await wrapper.execute_tool(tool_config, {})

    assert result["success"] is False
    assert "timed out" in result["error"].lower()


@pytest.mark.asyncio
async def test_environment_variables():
    """Test environment variable resolution."""
    import os

    os.environ["TEST_VAR"] = "test_value"

    wrapper = CLIWrapper(
        base_command="echo",
        environment={"MY_VAR": "${ENV:TEST_VAR}"},
    )

    resolved = wrapper._resolve_environment_variables()

    assert resolved["MY_VAR"] == "test_value"


@pytest.mark.asyncio
async def test_execute_resource_command():
    """Test executing a resource command."""
    wrapper = CLIWrapper(base_command="echo")

    content = await wrapper.execute_resource_command("echo resource content")

    assert "resource content" in content

