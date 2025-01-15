# Development Context

## Project State
- Working on RAG-Aether project setup and dependency installation
- Project uses Poetry for dependency management
- Currently experiencing dependency installation issues

## Environment
- OS: Linux 6.12.9-arch1-1
- Shell: /usr/bin/zsh
- Workspace: /home/jon/projects/aether

## Installation Progress
1. ✅ Generated poetry.lock file
2. ✅ Installed Fortran compiler (gfortran)
3. ✅ Installed OpenBLAS
4. ⏳ Currently attempting poetry install

## Project Structure
- Python testing infrastructure in place
- Key test files present:
  - tests/rag_aether/test_utils.py
  - tests/rag_aether/ai/test_base_rag.py
  - tests/pytest.ini

## Dependencies
From pyproject.toml:
- Core: sentence-transformers, faiss-cpu, numpy, aiohttp, python-dotenv
- Dev: pytest, pytest-asyncio, pytest-cov, hypothesis, black, isort, mypy

## Current Challenge
- Dependency installation interrupted during scipy downgrade
- Previous attempts resolved:
  - Lock file regeneration
  - Fortran compiler installation
  - OpenBLAS installation

<!-- LLM:verify Context preserved for next session --> 