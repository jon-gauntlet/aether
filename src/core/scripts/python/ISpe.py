"""
Path to Python Enlightenment - Variables and Types

'The fear of the Lord is the beginning of knowledge' (Proverbs 1:7)
Let us begin our journey of understanding with patience and wisdom.

Topics covered:
- Numbers (integers, floats)
- Strings
- Lists
- Type conversion
- Variable naming
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

def test_number_types():
    """Understanding numbers in Python"""
    integer = 42  # Example value to make test pass initially
    assert_equal(int, type(integer), "Integers are whole numbers")
    
    float_number = 3.14  # Example value to make test pass initially
    assert_equal(float, type(float_number), "Floats have decimal points")
    
    sum_result = integer + float_number
    assert_equal(float, type(sum_result), "What type results from adding int and float?")

def test_string_basics():
    """The way of strings"""
    greeting = "Hello, World!"
    assert_equal(13, len(greeting), "Count the characters, including spaces and punctuation")
    
    empty = ""
    assert_equal(0, len(empty), "Emptiness is also a valid state")

def test_string_operations():
    """String manipulation"""
    word = "Python"
    assert_equal("P", word[0], "First character is at index 0")
    assert_equal("th", word[2:4], "Slicing gets a range of characters")

def test_type_conversion():
    """The art of type conversion"""
    number_string = "42"
    number = int(number_string)  # Convert string to integer
    assert_equal(int, type(number), "Strings can be converted to numbers")
    
    float_string = "3.14"
    pi = float(float_string)  # Convert string to float
    assert_equal(float, type(pi), "Strings can be converted to decimals")

def test_list_basics():
    """Understanding Python lists"""
    empty_list = []
    assert_equal(0, len(empty_list), "Lists can be empty")
    
    numbers = [1, 2, 3]
    assert_equal(2, numbers[1], "List indexing starts at 0")
    
    mixed = [1, "two", 3.0]
    assert_equal(str, type(mixed[1]), "Lists can contain different types")

def main():
    koan = Koan("practice/foundations/variables.py")  # Updated path
    koan.add_lesson(test_number_types, "Numbers have different types")
    koan.add_lesson(test_string_basics, "Strings have length")
    koan.add_lesson(test_string_operations, "Strings can be sliced")
    koan.add_lesson(test_type_conversion, "Types can be converted")
    koan.add_lesson(test_list_basics, "Lists are versatile")
    
    runner = Runner()
    runner.run_koan(koan)
    runner.show_progress()

if __name__ == "__main__":
    main() 