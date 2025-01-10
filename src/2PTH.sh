#!/bin/bash

echo "🔍 Starting environment troubleshooting..."

# Check Python version
echo "Checking Python version..."
python_version=$(python3 --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✓ Python installed: $python_version"
else
    echo "✗ Python not found! Please install Python 3.12 or later"
    exit 1
fi

# Check pip
echo "Checking pip installation..."
pip_version=$(pip3 --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✓ pip installed: $pip_version"
else
    echo "✗ pip not found! Installing pip..."
    python3 -m ensurepip --upgrade
fi

# Check pipenv
echo "Checking pipenv installation..."
pipenv_version=$(pipenv --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✓ pipenv installed: $pipenv_version"
else
    echo "✗ pipenv not found! Installing pipenv..."
    pip3 install --user pipenv
fi

# Clean existing environment if requested
if [ "$1" == "--clean" ]; then
    echo "Cleaning existing environment..."
    pipenv --rm 2>/dev/null
fi

# Create/verify virtual environment
echo "Setting up virtual environment..."
pipenv --python 3.12 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  Failed to create environment with Python 3.12, trying system Python..."
    pipenv --python python3
fi

# Install dependencies
echo "Installing dependencies..."
pipenv install
if [ $? -ne 0 ]; then
    echo "⚠️  Failed to install dependencies. Trying with --skip-lock..."
    pipenv install --skip-lock
fi

# Verify installation
echo "Verifying installation..."
pipenv run python -c "
import numpy
import pandas
import pytest
print('✓ Core packages verified')
"

echo "
🎉 Setup complete! To start using the environment:
1. Run 'pipenv shell' to activate
2. Use 'python practice/easy/array_sum.py' to test
3. If issues persist, run './troubleshoot_env.sh --clean'
" 