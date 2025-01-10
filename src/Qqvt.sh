#!/bin/bash

echo "🔄 Starting repository recovery..."

# Directory structure
directories=(
    "practice/easy"
    "practice/medium"
    "practice/hard"
    "practice/coding-interview"
    "practice/coding-challenges"
    "practice/python-exercises"
    "learn"
    "review"
    "quiz"
    "cheatsheets"
    "flashcards"
    "mock_tests"
    ".maintenance"
)

# Recreate directory structure
echo "Creating directory structure..."
for dir in "${directories[@]}"; do
    mkdir -p "$dir"
    echo "✓ Created $dir"
done

# Restore core files if missing
echo "Checking core files..."

# Pipfile
if [ ! -f "Pipfile" ]; then
    echo "Restoring Pipfile..."
    cat > Pipfile << 'EOF'
[[source]]
url = "https://pypi.org/simple"
verify_ssl = true
name = "pypi"

[packages]
numpy = "*"
pandas = "*"
pytest = "*"
matplotlib = "*"
jupyter = "*"

[requires]
python_version = "3.12"
EOF
fi

# Example problem
if [ ! -f "practice/easy/array_sum.py" ]; then
    echo "Creating example problem..."
    cat > practice/easy/array_sum.py << 'EOF'
"""
Problem: Array Sum
Difficulty: Easy
Source: CodeSignal Practice

Given an array of integers, find the sum of its elements.
"""

def array_sum(arr):
    return sum(arr)

if __name__ == "__main__":
    test_cases = [
        ([1, 2, 3, 4], 10),
        ([], 0),
        ([-1, -2, -3], -6)
    ]
    
    for arr, expected in test_cases:
        result = array_sum(arr)
        assert result == expected, f"Test failed! Expected {expected}, got {result}"
        print(f"✓ Test passed: array_sum({arr}) = {result}")
EOF
fi

# Set up environment
echo "Setting up Python environment..."
if ! command -v pipenv &> /dev/null; then
    echo "Installing pipenv..."
    pip install --user pipenv
fi

# Clean and recreate environment
pipenv --rm 2>/dev/null
pipenv install

echo "
🎉 Repository recovery complete!
1. Directory structure restored
2. Core files recovered
3. Python environment reset

Next steps:
1. Run 'pipenv shell' to activate environment
2. Try 'python practice/easy/array_sum.py' to verify
3. Start adding your practice problems
" 