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

def test_number_types():
    """Understanding numbers in Python"""
    integer = __  # Replace __ with a whole number
    assert type(integer) == int, "Integers are whole numbers"
    
    float_number = __  # Replace __ with a decimal number
    assert type(float_number) == float, "Floats have decimal points"
    
    sum_result = integer + float_number
    assert type(sum_result) == __, "What type results from adding int and float?"

def test_string_basics():
    """The way of strings"""
    greeting = __  # Replace __ with 'Hello, World!'
    assert len(greeting) == 13, "Count the characters, including spaces and punctuation"
    
    empty = __  # Replace __ with an empty string
    assert len(empty) == 0, "Emptiness is also a valid state"

def test_string_operations():
    """String manipulation"""
    word = "Python"
    assert word[__] == "P", "First character is at index 0"
    assert word[__:__] == "th", "Slicing gets a range of characters"

def test_type_conversion():
    """The art of type conversion"""
    number_string = "42"
    number = __(number_string)  # Convert string to integer
    assert type(number) == int, "Strings can be converted to numbers"
    
    float_string = "3.14"
    pi = __(float_string)  # Convert string to float
    assert type(pi) == float, "Strings can be converted to decimals"

def test_list_basics():
    """Understanding Python lists"""
    empty_list = __  # Create an empty list
    assert len(empty_list) == 0, "Lists can be empty"
    
    numbers = [1, 2, 3]
    assert numbers[__] == 2, "List indexing starts at 0"
    
    mixed = [1, "two", 3.0]
    assert type(mixed[__]) == str, "Lists can contain different types"

if __name__ == "__main__":
    tests = [
        test_number_types,
        test_string_basics,
        test_string_operations,
        test_type_conversion,
        test_list_basics
    ]
    
    for test in tests:
        try:
            test()
            print(f"✓ {test.__doc__}")
        except AssertionError as e:
            print(f"\n🔥 {test.__doc__}")
            print(f"  Your code seeks enlightenment...")
            print(f"  {str(e)}")
            break
        except NameError:
            print(f"\n🔥 {test.__doc__}")
            print("  Replace the __ with your solution")
            break
        except TypeError as e:
            print(f"\n🔥 {test.__doc__}")
            print("  Your types have strayed from the path...")
            print(f"  {str(e)}")
            break 