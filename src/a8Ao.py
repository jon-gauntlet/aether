"""
Path to Python Enlightenment - Loops and Iteration

'Let us not grow weary while doing good, for in due season we shall reap if we do not lose heart.' (Galatians 6:9)
Through repetition and patience, we build understanding.

Topics covered:
- For loops
- While loops
- Range function
- Loop control (break, continue)
- List comprehension
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

def test_for_loop_basics():
    """Understanding for loops"""
    numbers = [1, 2, 3, 4, 5]
    sum_result = 0
    for num in numbers:
        sum_result += num
    assert_equal(15, sum_result, "For loops can sum numbers")

def test_while_loop():
    """Understanding while loops"""
    counter = 0
    result = 0
    while counter < 5:
        result += counter
        counter += 1
    assert_equal(10, result, "While loops continue until condition is false")

def test_range_function():
    """Understanding range"""
    numbers = list(range(5))
    assert_equal(5, len(numbers), "Range creates a sequence of numbers")
    assert_equal(0, numbers[0], "Range starts at zero by default")
    assert_equal(4, numbers[-1], "Last number is one less than the stop value")

def test_loop_control():
    """Understanding break and continue"""
    result = []
    for i in range(10):
        if i == 3:
            continue  # Skip 3
        if i == 7:
            break    # Stop at 7
        result.append(i)
    assert_equal([0,1,2,4,5,6], result, "Break and continue control loop flow")

def test_list_comprehension():
    """Understanding list comprehension"""
    numbers = [1, 2, 3, 4, 5]
    squares = [n * n for n in numbers]
    assert_equal([1,4,9,16,25], squares, "List comprehension creates new lists")
    
    even_squares = [n * n for n in numbers if n % 2 == 0]
    assert_equal(__, even_squares, "Can filter in list comprehension")

def main():
    koan = Koan("practice/foundations/loops.py")
    koan.add_lesson(test_for_loop_basics, "For loops iterate over sequences")
    koan.add_lesson(test_while_loop, "While loops repeat until condition is false")
    koan.add_lesson(test_range_function, "Range creates number sequences")
    koan.add_lesson(test_loop_control, "Break and continue control flow")
    koan.add_lesson(test_list_comprehension, "List comprehension is powerful")
    
    runner = Runner()
    runner.run_koan(koan)
    runner.show_progress()

if __name__ == "__main__":
    main() 