"""
Topic: [Exercise Name]
Scripture: [Primary NKJV verse for concept]
Focus Time: 25 minutes

'But solid food belongs to those who are of full age, that is, those who by reason 
of use have their senses exercised to discern both good and evil.' (Hebrews 5:14)

This exercise will help you understand [concept] through focused practice.
Each test builds upon the previous one, gradually increasing in complexity.

Structure:
1. Read the scripture and reflect on its connection to the concept
2. Attempt each test in order
3. Take short breaks between sections if needed
4. Review what you learned
"""

from src.runner import __, assert_equal, Koan

def implementation():
    """
    Primary implementation function.
    '[Relevant NKJV verse about implementation]'
    
    Replace the placeholder with your solution.
    """
    return __

def test_foundation():
    """
    '[NKJV verse about beginnings]'
    First, understand the basic concept.
    """
    assert_equal(__, implementation(),
                "Start with the simplest case")

def test_understanding():
    """
    '[NKJV verse about growth]'
    Build upon the foundation.
    """
    assert_equal(__, implementation(),
                "Apply what you learned")

def test_application():
    """
    '[NKJV verse about application]'
    Put your understanding into practice.
    """
    assert_equal(__, implementation(),
                "Use the concept in context")

def test_mastery():
    """
    '[NKJV verse about completion]'
    Demonstrate full understanding.
    """
    assert_equal(__, implementation(),
                "Show mastery of the concept")

# Visual progress markers
CHECKPOINTS = """
🏁 Start your journey
↓
📚 Learn the concept
↓
💡 Understand the pattern
↓
⚡ Apply your knowledge
↓
🎯 Demonstrate mastery
"""

def main():
    print(CHECKPOINTS)
    
    koan = Koan(__file__)
    koan.add_lesson(test_foundation, "Begin with basics")
    koan.add_lesson(test_understanding, "Grow in knowledge")
    koan.add_lesson(test_application, "Apply wisdom")
    koan.add_lesson(test_mastery, "Reach mastery")
    
    runner = Runner()
    runner.run_koan(koan)
    runner.show_progress()

if __name__ == "__main__":
    main() 