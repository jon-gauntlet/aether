#!/bin/bash

echo "🔍 Starting environment troubleshooting..."

# Check Python version
echo -e "\n📌 Python version:"
python --version

# Check Pipenv installation
echo -e "\n📌 Pipenv version:"
pipenv --version

# Check if virtualenv exists
echo -e "\n📌 Checking virtual environment..."
pipenv --venv || echo "Virtual environment not found"

# Try installing from requirements if Pipfile fails
if ! pipenv install; then
    echo -e "\n⚠️ Pipenv install failed. Trying alternative setup..."
    echo "Creating new virtual environment with requirements.txt..."
    python -m venv venv
    source venv/bin/activate
    pip install -r consolidated_requirements.txt
fi

# Verify key packages
echo -e "\n📌 Verifying key packages..."
packages=(
    "numpy"
    "pandas"
    "pytest"
    "jupyter"
    "matplotlib"
)

for package in "${packages[@]}"; do
    python -c "import $package" 2>/dev/null && echo "✅ $package installed" || echo "❌ $package missing"
done

echo -e "\n🔍 Troubleshooting complete!"
echo "If you're still having issues, try:"
echo "1. Remove Pipfile.lock and retry: rm Pipfile.lock && pipenv install"
echo "2. Clean cache: pipenv --clear"
echo "3. Use requirements: pip install -r consolidated_requirements.txt" 