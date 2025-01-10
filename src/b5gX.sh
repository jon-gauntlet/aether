#!/bin/bash

# Ensure we're in a Pipenv environment
if [ -z "$PIPENV_ACTIVE" ]; then
    echo "Initializing Pipenv environment..."
    pipenv install
fi

# Install common DSA packages
echo "Installing common DSA packages..."
pipenv install numpy pandas matplotlib pytest

# Run the requirements gatherer
echo "Gathering requirements from downloaded resources..."
python gather_requirements.py

# Install consolidated requirements
if [ -f consolidated_requirements.txt ]; then
    echo "Installing gathered requirements..."
    pipenv install -r consolidated_requirements.txt
fi

echo "Setup complete!" 