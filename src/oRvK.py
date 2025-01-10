"""
Topic: Array Sum - Understanding Collections
Scripture: 'Gather the fragments that remain, so that nothing is lost.' (John 6:12)
Focus Time: 25 minutes

'The Lord is my shepherd; I shall not want.' (Psalm 23:1)
As a shepherd counts his flock, we learn to count and sum numbers.
Each test guides you through understanding how to work with collections.

Structure:
1. Read the scripture and reflect on its connection to arrays
2. Attempt each test in order
3. Take short breaks between sections if needed
4. Review what you learned
"""

from src.runner import __, assert_equal, Koan

def array_sum(arr):
    """
    Calculate the sum of array elements.
    'But gather the wheat into my barn.' (Matthew 13:30)
    
    Replace the placeholder with your solution.
    """
    return __

def test_foundation():
    """
    'The earth was without form, and void.' (Genesis 1:2)
    Begin with emptiness - the sum of nothing is zero.
    """
    assert_equal(0, array_sum([]), 
                "Empty arrays sum to zero")

def test_understanding():
    """
    'One thing I have desired of the Lord.' (Psalm 27:4)
    Understand the simplest case - a single element.
    """
    assert_equal(42, array_sum([42]), 
                "Single element arrays sum to that element")

def test_application():
    """
    'Two are better than one, because they have a good reward for their labor.' (Ecclesiastes 4:9)
    Apply your knowledge to combine multiple elements.
    """
    assert_equal(10, array_sum([3, 7]), 
                "Arrays with multiple elements sum together")

def test_mastery():
    """
    'To everything there is a season, A time for every purpose under heaven.' (Ecclesiastes 3:1)
    Master working with both positive and negative numbers.
    """
    assert_equal(0, array_sum([-1, 1, -2, 2]), 
                "Handle positive and negative numbers")

# Visual progress markers
CHECKPOINTS = """
🏁 Begin your journey with arrays
↓
📚 Learn about empty arrays
↓
💡 Understand single elements
↓
⚡ Apply to multiple elements
↓
🎯 Master positive and negative
"""

def main():
    print(CHECKPOINTS)
    
    koan = Koan(__file__)
    koan.add_lesson(test_foundation, "Begin with emptiness")
    koan.add_lesson(test_understanding, "Find unity in one")
    koan.add_lesson(test_application, "Join many as one")
    koan.add_lesson(test_mastery, "Balance all numbers")
    
    runner = Runner()
    runner.run_koan(koan)
    runner.show_progress()

if __name__ == "__main__":
    main() 