"""Tests for template rendering."""

import pytest

from cli_as_mcp.templates import render_template, validate_template


def test_simple_placeholder():
    """Test simple placeholder replacement."""
    template = "echo {message}"
    params = {"message": "hello"}

    result = render_template(template, params)

    assert result == "echo hello"


def test_multiple_placeholders():
    """Test multiple placeholder replacement."""
    template = "git commit -m '{message}' --author '{author}'"
    params = {"message": "test commit", "author": "Test User"}

    result = render_template(template, params)

    assert result == "git commit -m 'test commit' --author 'Test User'"


def test_conditional_true():
    """Test conditional block when parameter is true."""
    template = "npm install {package}{#if dev} --save-dev{/if}"
    params = {"package": "express", "dev": True}

    result = render_template(template, params)

    assert result == "npm install express --save-dev"


def test_conditional_false():
    """Test conditional block when parameter is false."""
    template = "npm install {package}{#if dev} --save-dev{/if}"
    params = {"package": "express", "dev": False}

    result = render_template(template, params)

    assert result == "npm install express"


def test_conditional_missing():
    """Test conditional block when parameter is missing."""
    template = "git diff{#if file} {file}{/if}"
    params = {}

    result = render_template(template, params)

    assert result == "git diff"


def test_conditional_with_value():
    """Test conditional block with a value."""
    template = "git diff{#if file} {file}{/if}"
    params = {"file": "README.md"}

    result = render_template(template, params)

    assert result == "git diff README.md"


def test_mixed_placeholders_and_conditionals():
    """Test template with both placeholders and conditionals."""
    template = "command {arg1}{#if flag} --flag{/if} {arg2}"
    params = {"arg1": "value1", "flag": True, "arg2": "value2"}

    result = render_template(template, params)

    assert result == "command value1 --flag value2"


def test_none_value():
    """Test placeholder with None value."""
    template = "echo {message}"
    params = {"message": None}

    result = render_template(template, params)

    assert result == "echo "


def test_validate_template_valid():
    """Test template validation with all required parameters."""
    template = "command {arg1} {arg2}"
    required = {"arg1", "arg2"}

    assert validate_template(template, required) is True


def test_validate_template_missing():
    """Test template validation with missing required parameters."""
    template = "command {arg1}"
    required = {"arg1", "arg2"}

    assert validate_template(template, required) is False


def test_validate_template_extra():
    """Test template validation with extra parameters."""
    template = "command {arg1} {arg2} {arg3}"
    required = {"arg1", "arg2"}

    assert validate_template(template, required) is True

