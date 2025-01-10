"""
Path to Python Enlightenment - Binary Search

Binary search is an efficient algorithm for searching a sorted array by repeatedly
dividing the search interval in half. The journey to understanding begins with
these tests.

Remember:
- The input array must be sorted
- Each step should halve the search space
- The path to enlightenment is in understanding why each test fails

Time Complexity Goal: O(log n)
Space Complexity Goal: O(1)
"""

def binary_search(arr, target):
    """
    Implement binary search to find target in sorted array arr.
    Replace the __ with the appropriate code to make tests pass.
    
    Returns:
        int: Index of target if found, -1 if not found
    """
    left = __  # Starting point of our search
    right = __  # Ending point of our search
    
    while left <= right:
        mid = __  # Calculate middle point
        
        if arr[mid] == target:
            return __  # Found the target
        elif arr[mid] < target:
            left = __  # Search in right half
        else:
            right = __  # Search in left half
            
    return __  # Target not found

def test_empty_array():
    """The journey begins with emptiness"""
    assert binary_search([], 5) == __, "Empty arrays contain nothing"

def test_single_element_found():
    """Finding enlightenment in solitude"""
    assert binary_search([42], 42) == __, "Single element arrays can contain our target"

def test_single_element_not_found():
    """Learning from absence"""
    assert binary_search([42], 24) == __, "Single element arrays might not contain our target"

def test_simple_array_found():
    """The path through sorted elements"""
    assert binary_search([1, 3, 5, 7, 9], 5) == __, "The middle holds truth"

def test_simple_array_not_found():
    """Understanding what is not there"""
    assert binary_search([1, 3, 5, 7, 9], 4) == __, "Some numbers are not on our path"

def test_first_element():
    """Finding the beginning"""
    assert binary_search([1, 3, 5, 7, 9], 1) == __, "Truth can be found at the start"

def test_last_element():
    """Finding the end"""
    assert binary_search([1, 3, 5, 7, 9], 9) == __, "Truth can be found at the end"

def test_larger_array():
    """The path through many elements"""
    assert binary_search(list(range(100)), 42) == __, "Larger journeys require the same steps"

if __name__ == "__main__":
    tests = [
        test_empty_array,
        test_single_element_found,
        test_single_element_not_found,
        test_simple_array_found,
        test_simple_array_not_found,
        test_first_element,
        test_last_element,
        test_larger_array
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
        except IndexError as e:
            print(f"\n🔥 {test.__doc__}")
            print("  Your code has strayed from the path...")
            print(f"  {str(e)}")
            break 