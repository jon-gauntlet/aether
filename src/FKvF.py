"""
Path to Python Enlightenment - Array Sum

The goal is to learn array operations in Python through test-driven development.
Each test builds upon the previous ones, gradually increasing in complexity.

To begin your journey:
1. Read the test description
2. Run the tests (they will fail)
3. Read the failure message
4. Fix the code
5. Run the tests again
6. Reflect on what you learned
7. Move to the next test

Remember: The path to enlightenment is in the journey, not the destination.
"""

from src.runner import __, assert_equal, Koan

def array_sum(arr):
    """
    A function to calculate the sum of array elements.
    Replace the __ with the appropriate code to make tests pass.
    """
    return __

def test_empty_array():
    """The journey begins with emptiness. What is the sum of nothing?"""
    assert_equal(0, array_sum([]), 
                "Empty arrays should sum to zero")

def test_single_element():
    """Understanding the simplest case - a single element"""
    assert_equal(__, array_sum([42]), 
                "Single element arrays sum to that element")

def test_two_elements():
    """The art of adding two numbers"""
    assert_equal(__, array_sum([3, 7]), 
                "Arrays with two elements sum to their addition")

def test_negative_numbers():
    """The way of positive and negative"""
    assert_equal(__, array_sum([-1, -2, -3]), 
                "Negative numbers follow the same path")

def test_mixed_numbers():
    """Balance between positive and negative"""
    assert_equal(__, array_sum([-1, 1, -2, 2]), 
                "Mixed numbers seek balance")

def test_large_numbers():
    """The path of larger sequences"""
    assert_equal(__, array_sum([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 
                "Longer journeys require patience")

if __name__ == "__main__":
    koan = Koan("practice/easy/array_sum.py")
    koan.add_lesson(test_empty_array, "Empty arrays sum to zero")
    koan.add_lesson(test_single_element, "Single elements are preserved")
    koan.add_lesson(test_two_elements, "Two elements are added")
    koan.add_lesson(test_negative_numbers, "Negative numbers combine")
    koan.add_lesson(test_mixed_numbers, "Mixed numbers find balance")
    koan.add_lesson(test_large_numbers, "Large sequences sum correctly")
    
    runner = Runner()
    runner.run_koan(koan)
    runner.show_progress() 