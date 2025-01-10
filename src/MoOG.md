# Troubleshooting Guide

'But if any of you lacks wisdom, let him ask of God, who gives to all liberally and without reproach, and it will be given to him.' (James 1:5)

## Common Issues and Solutions

### Import Errors

If you see errors like `ImportError: No module named 'src'`:

1. Ensure you're in the correct directory:
   ```bash
   cd ~/git/python-dsa
   ```

2. Check that your Python path includes the repository root:
   ```python
   import sys
   print(sys.path)  # Should include your repository path
   ```

3. Try running the script directly from the repository root:
   ```bash
   ./path_to_enlightenment.py
   ```

### Missing Files

If you see `Cannot find X.py`:

1. Check the directory structure matches the study plan:
   ```
   practice/
   ├── foundations/
   │   ├── variables.py
   │   ├── loops.py
   │   └── functions.py
   ├── journey/
   │   └── easy/
   │       ├── array_sum.py
   │       └── binary_search.py
   └── mastery/
       ├── linked_list.py
       └── binary_tree.py
   ```

2. Ensure all files are in their correct locations:
   ```bash
   find practice -name "*.py"
   ```

### Test Failures

If tests are failing with `Expected X, Got Y`:

1. Read the test description and error message carefully
2. Look for the `__` placeholder in the code
3. Replace `__` with the correct value based on the test description
4. Run the test again to verify your solution

### Environment Issues

If you encounter environment-related errors:

1. Ensure Pipenv is installed and working:
   ```bash
   pipenv --version
   ```

2. Verify your virtual environment:
   ```bash
   pipenv shell
   python -c "import sys; print(sys.executable)"
   ```

3. Check installed packages:
   ```bash
   pipenv graph
   ```

4. If needed, reinstall dependencies:
   ```bash
   pipenv install
   ```

### Progress Tracking Issues

If your progress isn't being saved:

1. Check file permissions:
   ```bash
   ls -la ~/.python_dsa_progress
   ```

2. Ensure the directory exists:
   ```bash
   mkdir -p ~/.python_dsa_progress
   ```

3. Reset progress if needed:
   ```bash
   rm ~/.python_dsa_progress/*
   ```

## Offline Troubleshooting

When working offline:

1. All necessary files are included in the repository
2. No internet connection is required for exercises
3. Documentation is available in the `docs/` directory
4. Example solutions are in `.solutions/` (hidden by default)

## Getting Help

If you're still stuck:

1. Check the relevant documentation in `docs/`
2. Look for similar examples in completed exercises
3. Review the Biblical wisdom provided with each exercise
4. Take a break and return with fresh eyes

Remember: 'For God has not given us a spirit of fear, but of power and of love and of a sound mind.' (2 Timothy 1:7) 