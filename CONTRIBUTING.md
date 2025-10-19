# Contributing to CLI-as-MCP

Thank you for your interest in contributing to CLI-as-MCP! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and professional in all interactions.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/yourusername/cli-as-mcp/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - System information (OS, Python version)
   - Relevant logs or error messages

### Suggesting Features

1. Check existing [Issues](https://github.com/yourusername/cli-as-mcp/issues) and [Discussions](https://github.com/yourusername/cli-as-mcp/discussions)
2. Create a new issue or discussion with:
   - Clear description of the feature
   - Use cases and benefits
   - Possible implementation approach

### Pull Requests

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following the code style guidelines
4. **Add tests** for new functionality
5. **Run tests** to ensure everything passes:
   ```bash
   pytest
   ```
6. **Commit** with clear, descriptive messages:
   ```bash
   git commit -m "feat: add support for X"
   ```
7. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Create a Pull Request** with:
   - Clear title and description
   - Reference to related issues
   - Screenshots/examples if applicable

## Development Setup

### Prerequisites

- Python 3.10 or higher
- Git

### Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/cli-as-mcp.git
cd cli-as-mcp

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -e .
pip install -r requirements-dev.txt
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=cli_as_mcp

# Run specific test file
pytest tests/test_config.py

# Run with verbose output
pytest -v
```

### Code Style

We use:
- **Black** for code formatting
- **Ruff** for linting
- **MyPy** for type checking

```bash
# Format code
black src/ tests/

# Run linter
ruff check src/ tests/

# Run type checker
mypy src/
```

### Commit Message Format

Follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test changes
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

Examples:
```
feat: add support for environment variable substitution
fix: handle timeout errors gracefully
docs: update README with installation instructions
test: add tests for template rendering
```

## Project Structure

```
cli-as-mcp/
├── src/cli_as_mcp/     # Source code
│   ├── __init__.py
│   ├── server.py       # MCP server implementation
│   ├── cli_wrapper.py  # CLI execution logic
│   ├── config.py       # Configuration models
│   ├── templates.py    # Template engine
│   └── cli.py          # CLI interface
├── tests/              # Test suite
├── configs/            # Example configurations
├── examples/           # Usage examples
└── docs/              # Documentation
```

## Adding a New Feature

1. **Create configuration models** in `config.py` if needed
2. **Implement core logic** in appropriate module
3. **Add tests** in `tests/`
4. **Update documentation** in `README.md` or `docs/`
5. **Add example** in `configs/` or `examples/` if applicable

## Testing Guidelines

- Write tests for all new functionality
- Maintain or improve code coverage
- Use descriptive test names
- Test edge cases and error conditions
- Use fixtures for common setup

## Documentation

- Update README.md for user-facing changes
- Add docstrings to all public functions/classes
- Include type hints
- Provide examples for new features

## Questions?

- Open a [Discussion](https://github.com/yourusername/cli-as-mcp/discussions)
- Ask in the issue comments
- Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

