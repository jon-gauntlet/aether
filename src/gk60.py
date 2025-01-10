"""
Python DSA Koans Test Runner
"""
import sys
import inspect
import traceback
from pathlib import Path
from typing import Any, Callable, List, Tuple

class __, NotImplemented:
    """Represents a value that needs to be filled in"""
    def __eq__(self, other: Any) -> bool:
        return True

__ = __()

class Koan:
    def __init__(self, module_name: str):
        self.module_name = module_name
        self.lessons: List[Tuple[Callable, str]] = []
        
    def add_lesson(self, func: Callable, description: str):
        self.lessons.append((func, description))

class Runner:
    def __init__(self):
        self.koans_dir = Path(__file__).parent.parent / "practice"
        self.failed = False
        self.lesson_count = 0
        self.completed_count = 0
        
    def run_test(self, test_func: Callable) -> Tuple[bool, str]:
        """Run a single test and return (success, message)"""
        try:
            test_func()
            return True, ""
        except AssertionError as e:
            return False, str(e)
        except Exception as e:
            return False, f"Error: {str(e)}"
    
    def format_error(self, koan: Koan, func: Callable, message: str) -> str:
        """Format error message in Ruby Koans style"""
        func_lines = inspect.getsource(func).split("\n")
        doc = func.__doc__ or "No description provided"
        
        return f"""
{'=' * 80}
File: {koan.module_name}
Test: {func.__name__}

The Master says:
    {doc.strip()}

The code you seek to fix:
{func_lines[1]}

The error that blocks your path:
    {message}

Please meditate on the following code:
    {koan.module_name}#{func.__name__}
{'=' * 80}
"""

    def run_koan(self, koan: Koan) -> bool:
        """Run all tests in a koan file"""
        for func, description in koan.lessons:
            self.lesson_count += 1
            success, message = self.run_test(func)
            
            if success:
                self.completed_count += 1
                print(f"✓ {description}")
            else:
                print(self.format_error(koan, func, message))
                return False
        return True
    
    def show_progress(self):
        """Show progress bar like Ruby Koans"""
        if self.lesson_count == 0:
            return
        
        percent = (self.completed_count / self.lesson_count) * 100
        bar_width = 50
        completed = int((percent / 100) * bar_width)
        
        print("\nProgress:")
        print(f"[{'#' * completed}{'-' * (bar_width - completed)}] {percent:.1f}%")
        print(f"Completed: {self.completed_count}/{self.lesson_count} lessons")

def assert_equal(expected: Any, actual: Any, message: str = ""):
    """Assert equality with better error messages"""
    if expected != actual:
        raise AssertionError(
            f"\nExpected: {expected}\n" + 
            f"     Got: {actual}\n" +
            f"  Reason: {message}"
        )

def assert_true(condition: bool, message: str = ""):
    """Assert truth with better error messages"""
    if not condition:
        raise AssertionError(f"Expected true, but got false\nReason: {message}")

def assert_false(condition: bool, message: str = ""):
    """Assert false with better error messages"""
    if condition:
        raise AssertionError(f"Expected false, but got true\nReason: {message}") 