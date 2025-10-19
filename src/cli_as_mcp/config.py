"""Configuration models for CLI-as-MCP."""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ParameterConfig(BaseModel):
    """Configuration for a tool parameter."""

    type: str = Field(..., description="Parameter type (string, integer, boolean, etc.)")
    description: str = Field(..., description="Parameter description")
    default: Optional[Any] = Field(None, description="Default value")
    required: bool = Field(True, description="Whether parameter is required")


class ToolConfig(BaseModel):
    """Configuration for a CLI tool."""

    name: str = Field(..., description="Tool name")
    description: str = Field(..., description="Tool description")
    parameters: Dict[str, ParameterConfig] = Field(
        default_factory=dict, description="Tool parameters"
    )
    command_template: str = Field(..., description="Command template with placeholders")
    output_format: Optional[str] = Field(
        "text", description="Expected output format (text, json, etc.)"
    )
    timeout: Optional[int] = Field(30, description="Command timeout in seconds")


class ResourceConfig(BaseModel):
    """Configuration for an MCP resource."""

    uri: str = Field(..., description="Resource URI")
    name: str = Field(..., description="Resource name")
    description: str = Field(..., description="Resource description")
    command: str = Field(..., description="Command to get resource content")
    mime_type: Optional[str] = Field("text/plain", description="Resource MIME type")


class CLIConfig(BaseModel):
    """Main configuration for CLI-as-MCP."""

    name: str = Field(..., description="CLI tool name")
    command: str = Field(..., description="Base command")
    description: str = Field(..., description="CLI tool description")
    environment: Dict[str, str] = Field(
        default_factory=dict, description="Environment variables"
    )
    tools: List[ToolConfig] = Field(default_factory=list, description="Available tools")
    resources: List[ResourceConfig] = Field(
        default_factory=list, description="Available resources"
    )
    working_directory: Optional[str] = Field(None, description="Working directory for commands")

    @classmethod
    def from_file(cls, path: Path) -> "CLIConfig":
        """Load configuration from a JSON file."""
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return cls(**data)

    def to_file(self, path: Path) -> None:
        """Save configuration to a JSON file."""
        with open(path, "w", encoding="utf-8") as f:
            json.dump(self.model_dump(), f, indent=2)

