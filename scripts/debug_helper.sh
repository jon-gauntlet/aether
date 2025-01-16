#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting debug helper...${NC}"

# 1. Fix imports
echo "Fixing imports..."
find . -type f -name "*.py" -exec sed -i 's/from src.rag_aether/from rag_aether/g' {} +
find . -type f -name "*.py" -exec sed -i 's/import src.rag_aether/import rag_aether/g' {} +

# 2. Ensure directory structure
echo "Creating directory structure..."
mkdir -p src/rag_aether/data
mkdir -p src/rag_aether/ai
mkdir -p tests/rag_aether/ai

# 3. Create/update __init__.py files
echo "Updating __init__.py files..."
echo '"RAG Aether package."' > src/rag_aether/__init__.py
echo '"Data components for RAG system."' > src/rag_aether/data/__init__.py
echo '"AI components for RAG system."' > src/rag_aether/ai/__init__.py

# 4. Clean caches
echo "Cleaning caches..."
find . -type d -name "__pycache__" -exec rm -rf {} +
find . -type d -name ".pytest_cache" -exec rm -rf {} +
find . -type d -name "*.egg-info" -exec rm -rf {} +

# 5. Reinstall package
echo "Reinstalling package..."
pip install -e . > /dev/null 2>&1

# 6. Run specific test file for quick verification
echo "Running test verification..."
pytest tests/rag_aether/ai/test_query_expansion.py -v

echo -e "${GREEN}Debug helper completed${NC}" 