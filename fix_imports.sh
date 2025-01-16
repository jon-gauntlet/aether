#!/bin/bash

# Fix src imports
find . -type f -name "*.py" -exec sed -i 's/from src.rag_aether/from rag_aether/g' {} +
find . -type f -name "*.py" -exec sed -i 's/import src.rag_aether/import rag_aether/g' {} +

# Create missing __init__.py files
mkdir -p src/rag_aether/data
touch src/rag_aether/data/__init__.py
touch src/rag_aether/__init__.py

# Install package in development mode
pip install -e .

# Clear pytest cache
rm -rf .pytest_cache
rm -rf src/rag_aether/__pycache__
rm -rf tests/__pycache__

echo "Import paths fixed and caches cleared" 