"""
Path to Python Enlightenment - Functions

'For as we have many members in one body, but all the members do not have the same function' (Romans 12:4)
Each function serves its purpose in the greater whole.

Topics covered:
- Function definition
- Parameters and arguments
- Return values
- Default arguments
- Lambda functions
"""

import os
import sys
from pathlib import Path

# Add repository root to Python path if running directly
if __name__ == "__main__":
    repo_root = Path(__file__).parent.parent.parent
    if repo_root not in sys.path:
        sys.path.insert(0, str(repo_root))

from src import Runner, Koan, assert_equal, __

def test_function_basics():
    """Understanding function definition and calls"""
    def greet(name):
        return f"Hello, {name}!"
    
    result = greet("World")
    assert_equal("Hello, World!", result, "Functions can take parameters and return values")

def test_multiple_parameters():
    """Understanding multiple parameters"""
    def multiply(a, b):
        return a * b
    
    result = multiply(4, 5)
    assert_equal(20, result, "Functions can take multiple parameters")
    
    result2 = multiply(3.0, 2)
    assert_equal(6.0, type(result2), "Type of result depends on input types")

def test_default_arguments():
    """Understanding default arguments"""
    def power(base, exponent=2):
        return base ** exponent
    
    square = power(4)
    assert_equal(16, square, "Default argument is used when not specified")
    
    cube = power(3, 3)
    assert_equal(27, cube, "Default argument can be overridden")

def test_return_multiple_values():
    """Understanding multiple return values"""
    def divide_and_remainder(a, b):
        return a // b, a % b
    
    quotient, remainder = divide_and_remainder(7, 3)
    assert_equal(2, quotient, "First returned value")
    assert_equal(1, remainder, "Second returned value")

def test_lambda_functions():
    """Understanding lambda functions"""
    square = lambda x: x * x
    assert_equal(16, square(4), "Lambda functions are concise")
    
    numbers = [1, 2, 3, 4, 5]
    evens = list(filter(lambda x: x % 2 == 0, numbers))
    assert_equal([2,4], evens, "Lambda functions work with built-ins")

def main():
    koan = Koan("practice/foundations/functions.py")
    koan.add_lesson(test_function_basics, "Functions take input and return output")
    koan.add_lesson(test_multiple_parameters, "Functions can have multiple parameters")
    koan.add_lesson(test_default_arguments, "Parameters can have default values")
    koan.add_lesson(test_return_multiple_values, "Functions can return multiple values")
    koan.add_lesson(test_lambda_functions, "Lambda functions are anonymous functions")
    
    runner = Runner()
    runner.run_koan(koan)
    runner.show_progress()

if __name__ == "__main__":
    main() 