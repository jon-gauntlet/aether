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

def array_sum(arr):
    """
    A function to calculate the sum of array elements.
    Replace the __ with the appropriate code to make tests pass.
    """
    return __

def test_empty_array():
    """The journey begins with emptiness. What is the sum of nothing?"""
    assert array_sum([]) == __, "Empty arrays sum to zero"

def test_single_element():
    """Understanding the simplest case - a single element"""
    assert array_sum([42]) == __, "Single element arrays sum to that element"

def test_two_elements():
    """The art of adding two numbers"""
    assert array_sum([3, 7]) == __, "Arrays with two elements sum to their addition"

def test_negative_numbers():
    """The way of positive and negative"""
    assert array_sum([-1, -2, -3]) == __, "Negative numbers follow the same path"

def test_mixed_numbers():
    """Balance between positive and negative"""
    assert array_sum([-1, 1, -2, 2]) == __, "Mixed numbers seek balance"

def test_large_numbers():
    """The path of larger sequences"""
    assert array_sum([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) == __, "Longer journeys require patience"

if __name__ == "__main__":
    tests = [
        test_empty_array,
        test_single_element,
        test_two_elements,
        test_negative_numbers,
        test_mixed_numbers,
        test_large_numbers
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