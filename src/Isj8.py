"""
Path to Python Enlightenment - Array Sum

As Solomon gathered wisdom, so shall we gather numbers.
'The fear of the Lord is the beginning of knowledge' (Proverbs 1:7)
Let us begin our journey of understanding with patience and wisdom.

To begin your journey:
1. Read the test description
2. Run the tests (they will fail)
3. Read the failure message
4. Fix the code
5. Run the tests again
6. Reflect on what you learned
7. Move to the next test
"""

from src.runner import __, assert_equal, Koan

def array_sum(arr):
    """
    A function to calculate the sum of array elements.
    'But gather the wheat into my barn' (Matthew 13:30)
    Replace the __ with the appropriate code to make tests pass.
    """
    return __

def test_empty_array():
    """'The earth was without form, and void' (Genesis 1:2)
    What is the sum of nothing? As in the beginning, we start with void."""
    assert_equal(0, array_sum([]), 
                "Empty arrays should sum to zero")

def test_single_element():
    """'One thing I have desired of the Lord' (Psalm 27:4)
    Understanding begins with a single element."""
    assert_equal(__, array_sum([42]), 
                "Single element arrays sum to that element")

def test_two_elements():
    """'Two are better than one, because they have a good reward for their labor' (Ecclesiastes 4:9)
    Learn to join two numbers as one."""
    assert_equal(__, array_sum([3, 7]), 
                "Arrays with two elements sum to their addition")

def test_negative_numbers():
    """'Bear one another's burdens' (Galatians 6:2)
    As we bear burdens, we handle negative numbers."""
    assert_equal(__, array_sum([-1, -2, -3]), 
                "Negative numbers follow the same path")

def test_mixed_numbers():
    """'To everything there is a season' (Ecclesiastes 3:1)
    Balance between positive and negative, as there is time for all things."""
    assert_equal(__, array_sum([-1, 1, -2, 2]), 
                "Mixed numbers seek balance")

def test_large_numbers():
    """'Count it all joy when you fall into various trials' (James 1:2)
    The path of larger sequences requires patience and perseverance."""
    assert_equal(__, array_sum([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 
                "Longer journeys require patience")

if __name__ == "__main__":
    koan = Koan("practice/easy/array_sum.py")
    koan.add_lesson(test_empty_array, "Begin with emptiness")
    koan.add_lesson(test_single_element, "Find unity in one")
    koan.add_lesson(test_two_elements, "Join two as one")
    koan.add_lesson(test_negative_numbers, "Bear the burden of negatives")
    koan.add_lesson(test_mixed_numbers, "Balance all seasons")
    koan.add_lesson(test_large_numbers, "Count with joy")
    
    runner = Runner()
    runner.run_koan(koan)
    runner.show_progress() 