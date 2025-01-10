"""
Path to Python Enlightenment - Binary Search

'Seek and you will find' (Matthew 7:7)
Let us learn the art of efficient searching.

Topics covered:
- Binary search algorithm
- Sorted arrays
- Time complexity
- Edge cases
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

def binary_search(arr, target):
    """Implement binary search to find target in sorted array arr"""
    if not arr:
        return None  # What should we return for empty arrays?
    
    left = __  # Starting index
    right = __  # Ending index
    
    while left <= right:
        mid = __  # Calculate middle index
        if arr[mid] == target:
            return __  # Found the target!
        elif arr[mid] < target:
            left = __  # Search right half
        else:
            right = __  # Search left half
    
    return __  # Target not found

def test_empty_array():
    """Understanding edge cases"""
    empty = []
    result = binary_search(empty, 42)
    assert_equal(__, result, "Searching empty array returns -1")

def test_single_element():
    """Understanding base cases"""
    single = [42]
    result = binary_search(single, 42)
    assert_equal(__, result, "Found element should return its index")
    
    result = binary_search(single, 43)
    assert_equal(__, result, "Missing element should return -1")

def test_multiple_elements():
    """Understanding binary search"""
    numbers = [1, 3, 5, 7, 9, 11, 13]
    result = binary_search(numbers, 7)
    assert_equal(__, result, "Should find element in middle")
    
    result = binary_search(numbers, 13)
    assert_equal(__, result, "Should find element at end")
    
    result = binary_search(numbers, 1)
    assert_equal(__, result, "Should find element at start")

def test_missing_element():
    """Understanding not found cases"""
    numbers = [1, 3, 5, 7, 9]
    result = binary_search(numbers, 4)
    assert_equal(__, result, "Should return -1 for missing element")
    
    result = binary_search(numbers, 0)
    assert_equal(__, result, "Should return -1 for element below range")
    
    result = binary_search(numbers, 10)
    assert_equal(__, result, "Should return -1 for element above range")

def main():
    koan = Koan("practice/journey/easy/binary_search.py")
    koan.add_lesson(test_empty_array, "Handle empty arrays")
    koan.add_lesson(test_single_element, "Handle single elements")
    koan.add_lesson(test_multiple_elements, "Search in larger arrays")
    koan.add_lesson(test_missing_element, "Handle missing elements")
    
    runner = Runner()
    runner.run_koan(koan)
    runner.show_progress()

if __name__ == "__main__":
    main() 