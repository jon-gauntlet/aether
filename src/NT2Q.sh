#!/bin/bash

# Exit on error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Project root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Python files to check
PYTHON_FILES="$ROOT_DIR/lib"

# Print section header
print_header() {
    echo -e "\n${YELLOW}=== $1 ===${NC}\n"
}

# Check if command exists
check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}Error: $1 is required but not installed.${NC}"
        exit 1
    fi
}

# Verify required tools are installed
check_command black
check_command flake8
check_command isort
check_command mypy
check_command pylint

# Format code with black
print_header "Formatting code with Black"
black --check "$PYTHON_FILES" || {
    echo -e "${RED}Code formatting issues found. Running black to fix...${NC}"
    black "$PYTHON_FILES"
}

# Sort imports with isort
print_header "Checking import order with isort"
isort --check-only "$PYTHON_FILES" || {
    echo -e "${RED}Import order issues found. Running isort to fix...${NC}"
    isort "$PYTHON_FILES"
}

# Check style with flake8
print_header "Checking style with Flake8"
flake8 "$PYTHON_FILES" || {
    echo -e "${RED}Style issues found. Please fix them manually.${NC}"
    exit 1
}

# Type checking with mypy
print_header "Type checking with MyPy"
mypy "$PYTHON_FILES" || {
    echo -e "${RED}Type issues found. Please fix them manually.${NC}"
    exit 1
}

# Code analysis with pylint
print_header "Code analysis with Pylint"
pylint "$PYTHON_FILES" || {
    echo -e "${RED}Code quality issues found. Please fix them manually.${NC}"
    exit 1
}

# Run tests with pytest
print_header "Running tests with pytest"
pytest "$ROOT_DIR/tests" || {
    echo -e "${RED}Tests failed. Please fix them.${NC}"
    exit 1
}

# Success message
echo -e "\n${GREEN}All checks passed successfully!${NC}\n" 