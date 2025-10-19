"""CLI wrapper for executing commands."""

import asyncio
import os
import shlex
import subprocess
from pathlib import Path
from typing import Any, Dict, Optional

from .config import ToolConfig
from .templates import render_template


class CLIWrapper:
    """Wraps CLI commands for execution."""

    def __init__(
        self,
        base_command: str,
        working_directory: Optional[str] = None,
        environment: Optional[Dict[str, str]] = None,
    ):
        """Initialize the CLI wrapper.

        Args:
            base_command: Base CLI command
            working_directory: Working directory for command execution
            environment: Environment variables to set
        """
        self.base_command = base_command
        self.working_directory = Path(working_directory) if working_directory else Path.cwd()
        self.environment = environment or {}

    async def execute_tool(
        self, tool_config: ToolConfig, parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a tool with given parameters.

        Args:
            tool_config: Tool configuration
            parameters: Parameter values

        Returns:
            Dictionary with execution results
        """
        # Render command template with parameters
        command = render_template(tool_config.command_template, parameters)

        # Execute command
        try:
            result = await self._run_command(
                command, timeout=tool_config.timeout or 30
            )

            return {
                "success": True,
                "output": result["stdout"],
                "error": result["stderr"],
                "exit_code": result["returncode"],
            }
        except asyncio.TimeoutError:
            return {
                "success": False,
                "output": "",
                "error": f"Command timed out after {tool_config.timeout} seconds",
                "exit_code": -1,
            }
        except Exception as e:
            return {
                "success": False,
                "output": "",
                "error": str(e),
                "exit_code": -1,
            }

    async def execute_resource_command(self, command: str, timeout: int = 30) -> str:
        """Execute a command to retrieve resource content.

        Args:
            command: Command to execute
            timeout: Command timeout in seconds

        Returns:
            Command output as string
        """
        try:
            result = await self._run_command(command, timeout=timeout)
            return result["stdout"]
        except Exception as e:
            return f"Error retrieving resource: {str(e)}"

    async def _run_command(
        self, command: str, timeout: int = 30
    ) -> Dict[str, Any]:
        """Run a shell command asynchronously.

        Args:
            command: Command to execute
            timeout: Command timeout in seconds

        Returns:
            Dictionary with stdout, stderr, and returncode
        """
        # Prepare environment
        env = os.environ.copy()
        env.update(self._resolve_environment_variables())

        # Create subprocess
        process = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=str(self.working_directory),
            env=env,
        )

        # Wait for completion with timeout
        try:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(), timeout=timeout
            )
        except asyncio.TimeoutError:
            process.kill()
            await process.wait()
            raise

        return {
            "stdout": stdout.decode("utf-8", errors="replace"),
            "stderr": stderr.decode("utf-8", errors="replace"),
            "returncode": process.returncode,
        }

    def _resolve_environment_variables(self) -> Dict[str, str]:
        """Resolve environment variables from configuration.

        Returns:
            Dictionary of resolved environment variables
        """
        resolved = {}
        for key, value in self.environment.items():
            # Support ${ENV:VAR_NAME} syntax
            if value.startswith("${ENV:") and value.endswith("}"):
                env_var = value[6:-1]
                resolved[key] = os.environ.get(env_var, "")
            else:
                resolved[key] = value
        return resolved

