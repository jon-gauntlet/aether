# Python DSA Learning Journey

'Study to show yourself approved to God, a worker who does not need to be ashamed, rightly dividing the word of truth.' (2 Timothy 2:15)

## Quick Start

1. Clone and enter the repository:
   ```bash
   git clone https://github.com/yourusername/python-dsa.git
   cd python-dsa
   ```

2. Set up your environment (if not already done):
   ```bash
   # Install pipenv if needed
   pip install --user pipenv

   # Create and activate environment
   pipenv install
   pipenv shell
   ```

3. Begin your journey (choose one):
   ```bash
   # Option 1: Full journey (recommended)
   ./path_to_enlightenment.py

   # Option 2: Individual modules
   python practice/foundations/variables.py
   python practice/foundations/loops.py
   python practice/foundations/functions.pytheme>
   ```

## Repository Structure

```
.
├── practice/           # Progressive exercises
│   ├── foundations/    # Python basics
│   │   ├── variables.py
│   │   ├── loops.py
│   │   └── functions.py
│   ├── journey/        # Core DSA concepts
│   │   └── easy/
│   │       ├── array_sum.py
│   │       └── binary_search.py
│   └── mastery/       # Advanced topics
│       ├── linked_list.py
│       └── binary_tree.py
├── learn/             # Learning materials
├── docs/              # Documentation
└── src/              # Core functionality
```

## Usage

- Start with foundations:
  ```bash
  ./path_to_enlightenment.py --topic foundations
  ```

- Focus on specific topics:
  ```bash
  ./path_to_enlightenment.py --topic journey
  ```

- List all topics:
  ```bash
  ./path_to_enlightenment.py --list
  ```

## Key Topics

1. Python Foundations
   - Variables and Types
   - Control Flow
   - Functions
   - Object-Oriented Programming

2. Data Structures
   - Arrays and Lists
   - Linked Lists
   - Trees
   - Graphs

3. Algorithms
   - Searching
   - Sorting
   - Dynamic Programming
   - Graph Algorithms

## Offline Study Tips

1. Download all resources before going offline:
   ```bash
   # Ensure all dependencies are installed
   pipenv install
   
   # Verify environment works
   pipenv run python -c "print('Environment OK')"
   ```

2. Test your setup:
   ```bash
   # Should show all exercises
   ./path_to_enlightenment.py --list
   
   # Try a simple exercise
   python practice/foundations/variables.py
   ```

3. Keep these files handy:
   - `docs/TROUBLESHOOTING.md` for common issues
   - `docs/EXERCISE_STYLE.md` for exercise format
   - Your completed exercises for reference

## Troubleshooting

If you encounter any issues:

1. Check the [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
2. Review error messages carefully
3. Ensure you're in the correct directory
4. Verify your Python environment:
   ```bash
   # Should show python-dsa environment
   pipenv --venv
   
   # Should show installed packages
   pipenv graph
   ```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

Remember: 'The fear of the Lord is the beginning of wisdom, and the knowledge of the Holy One is understanding.' (Proverbs 9:10) 