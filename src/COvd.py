"""
Path to Python Enlightenment - Array Operations

'Every good gift and every perfect gift is from above' (James 1:17)
Let us learn to work with collections of values.

Topics covered:
- Array traversal
- Sum operations
- Edge cases
- Performance considerations
"""

import os
import sys
from pathlib import Path

# Add repository root to Python path if running directly
if __name__ == "__main__":
    repo_root = Path(__file__).parent.parent.parent.parent
    if repo_root not in sys.path:
        sys.path.insert(0, str(repo_root))

from src import Runner, Koan, assert_equal, __

def array_sum(arr):
    """Calculate the sum of array elements"""
    return __  # Replace __ with your solution

def test_empty_array():
    """Understanding edge cases"""
    empty = []
    result = array_sum(empty)
    assert_equal(__, result, "Sum of empty array is zero")

def test_single_element():
    """Understanding base cases"""
    single = [42]
    result = array_sum(single)
    assert_equal(__, result, "Sum of single element is the element itself")

def test_multiple_elements():
    """Understanding array traversal"""
    numbers = [1, 2, 3, 4, 5]
    result = array_sum(numbers)
    assert_equal(__, result, "Sum should add all elements")

def test_negative_numbers():
    """Understanding mixed values"""
    numbers = [-1, 2, -3, 4, -5]
    result = array_sum(numbers)
    assert_equal(__, result, "Sum works with negative numbers")

def test_floating_point():
    """Understanding numeric types"""
    numbers = [1.5, 2.5, 3.5]
    result = array_sum(numbers)
    assert_equal(__, result, "Sum works with floating point numbers")

def main():
    koan = Koan("practice/journey/easy/array_sum.py")
    koan.add_lesson(test_empty_array, "Handle empty arrays")
    koan.add_lesson(test_single_element, "Handle single elements")
    koan.add_lesson(test_multiple_elements, "Sum multiple elements")
    koan.add_lesson(test_negative_numbers, "Handle negative numbers")
    koan.add_lesson(test_floating_point, "Handle floating point numbers")
    
    runner = Runner()
    runner.run_koan(koan)
    runner.show_progress()

if __name__ == "__main__":
    main() 