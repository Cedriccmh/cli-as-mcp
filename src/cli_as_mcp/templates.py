"""Template rendering for command templates."""

import re
from typing import Any, Dict


def render_template(template: str, parameters: Dict[str, Any]) -> str:
    """Render a command template with parameters.

    Supports:
    - Simple placeholders: {param_name}
    - Conditional blocks: {#if param_name}...{/if}
    - Boolean flags: {#if flag}--flag{/if}

    Args:
        template: Command template string
        parameters: Parameter values

    Returns:
        Rendered command string
    """
    result = template

    # Handle conditional blocks first
    # Pattern: {#if param_name}content{/if}
    conditional_pattern = r"\{#if\s+(\w+)\}(.*?)\{/if\}"

    def replace_conditional(match: re.Match) -> str:
        param_name = match.group(1)
        content = match.group(2)
        param_value = parameters.get(param_name)

        # Include content if parameter is truthy
        if param_value:
            return content
        return ""

    result = re.sub(conditional_pattern, replace_conditional, result, flags=re.DOTALL)

    # Handle simple placeholders
    # Pattern: {param_name}
    for key, value in parameters.items():
        placeholder = f"{{{key}}}"
        if placeholder in result:
            # Escape shell-sensitive characters if needed
            str_value = str(value) if value is not None else ""
            result = result.replace(placeholder, str_value)

    return result


def validate_template(template: str, required_params: set) -> bool:
    """Validate that a template has all required parameters.

    Args:
        template: Command template string
        required_params: Set of required parameter names

    Returns:
        True if template is valid, False otherwise
    """
    # Find all placeholders in template
    placeholders = set(re.findall(r"\{(\w+)\}", template))

    # Check if all required params are present
    return required_params.issubset(placeholders)

