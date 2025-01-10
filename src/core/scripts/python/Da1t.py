"""
Path to Python Enlightenment - Variables and Types

The journey begins with understanding Python's basic types and variables.
Each test will teach you about a different aspect of Python variables.

Topics covered:
- Numbers (integers, floats)
- Strings
- Lists
- Type conversion
- Variable naming
"""

from src.runner import __, assert_equal, Koan

def test_number_types():
    """Understanding numbers in Python"""
    integer = __  # Replace __ with a whole number
    assert_equal(int, type(integer), "Integers are whole numbers")
    
    float_number = __  # Replace __ with a decimal number
    assert_equal(float, type(float_number), "Floats have decimal points")
    
    sum_result = integer + float_number
    assert_equal(__, type(sum_result), "What type results from adding int and float?")

def test_string_basics():
    """The way of strings"""
    greeting = __  # Replace __ with 'Hello, World!'
    assert_equal(13, len(greeting), "Count the characters, including spaces and punctuation")
    
    empty = __  # Replace __ with an empty string
    assert_equal(0, len(empty), "Emptiness is also a valid state")

def test_string_operations():
    """String manipulation"""
    word = "Python"
    assert_equal("P", word[__], "First character is at index 0")
    assert_equal("th", word[__:__], "Slicing gets a range of characters")

def test_type_conversion():
    """The art of type conversion"""
    number_string = "42"
    number = __(number_string)  # Convert string to integer
    assert_equal(int, type(number), "Strings can be converted to numbers")
    
    float_string = "3.14"
    pi = __(float_string)  # Convert string to float
    assert_equal(float, type(pi), "Strings can be converted to decimals")

def test_list_basics():
    """Understanding Python lists"""
    empty_list = __  # Create an empty list
    assert_equal(0, len(empty_list), "Lists can be empty")
    
    numbers = [1, 2, 3]
    assert_equal(2, numbers[__], "List indexing starts at 0")
    
    mixed = [1, "two", 3.0]
    assert_equal(str, type(mixed[__]), "Lists can contain different types")

def main():
    koan = Koan("practice/fundamentals/variables.py")
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