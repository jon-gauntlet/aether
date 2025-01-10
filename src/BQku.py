"""
Problem: Array Sum
Difficulty: Easy
Source: CodeSignal Practice

Given an array of integers, find the sum of its elements.

Example:
Input: [1, 2, 3, 4]
Output: 10

Time Complexity: O(n)
Space Complexity: O(1)
"""

def array_sum(arr):
    """
    Calculate the sum of array elements.
    
    Args:
        arr (List[int]): Array of integers
        
    Returns:
        int: Sum of all elements
        
    Examples:
        >>> array_sum([1, 2, 3, 4])
        10
        >>> array_sum([])
        0
        >>> array_sum([-1, -2, -3])
        -6
    """
    return sum(arr)

# Built-in test cases using doctest
if __name__ == "__main__":
    import doctest
    doctest.testmod()
    
    # Additional test cases
    test_cases = [
        ([1, 2, 3, 4], 10),
        ([], 0),
        ([-1, -2, -3], -6),
        ([10], 10),
        ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 55)
    ]
    
    for arr, expected in test_cases:
        result = array_sum(arr)
        assert result == expected, f"Test failed! Expected {expected}, got {result}"
        print(f"✓ Test passed: array_sum({arr}) = {result}") 