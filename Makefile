.PHONY: help install install-dev test lint format clean build

help:
	@echo "CLI-as-MCP Development Commands"
	@echo "================================"
	@echo "install        Install package"
	@echo "install-dev    Install package with dev dependencies"
	@echo "test           Run tests"
	@echo "test-cov       Run tests with coverage"
	@echo "lint           Run linters"
	@echo "format         Format code"
	@echo "clean          Clean build artifacts"
	@echo "build          Build package"

install:
	pip install -e .

install-dev:
	pip install -e .
	pip install -r requirements-dev.txt

test:
	pytest

test-cov:
	pytest --cov=cli_as_mcp --cov-report=html --cov-report=term

lint:
	ruff check src/ tests/
	mypy src/

format:
	black src/ tests/
	ruff check --fix src/ tests/

clean:
	rm -rf build/
	rm -rf dist/
	rm -rf *.egg-info
	rm -rf .pytest_cache
	rm -rf .mypy_cache
	rm -rf htmlcov
	rm -rf .coverage
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

build: clean
	python -m build

