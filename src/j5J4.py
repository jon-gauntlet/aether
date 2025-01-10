"""
Path to Python Enlightenment - Linked Lists

'For we are members of His body, of His flesh and of His bones.' (Ephesians 5:30)
As each node connects to form a whole, we learn the power of linked structures.

Topics covered:
- Node creation
- List traversal
- Insertion
- Deletion
- List manipulation
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

class Node:
    def __init__(self, value=None, next=None):
        self.value = value
        self.next = next

class LinkedList:
    def __init__(self):
        self.head = None
        self.length = 0
    
    def append(self, value):
        """Add a new node with value to the end of the list"""
        if not self.head:
            self.head = __  # Create first node
        else:
            current = self.head
            while __:  # When should we stop?
                current = current.next
            current.next = __  # Add new node
        self.length = __  # Update length
    
    def get_values(self):
        """Return list of all values"""
        values = []
        current = __  # Start at beginning
        while current:
            values.append(__)  # Add each value
            current = __  # Move to next node
        return values

def test_empty_list():
    """Understanding empty lists"""
    lst = LinkedList()
    assert_equal(__, lst.head, "Empty list has no head")
    assert_equal(__, lst.length, "Empty list has zero length")

def test_single_node():
    """Understanding single node lists"""
    lst = LinkedList()
    lst.append(42)
    assert_equal(__, lst.head.value, "Head node should contain the value")
    assert_equal(__, lst.head.next, "Single node should point to None")
    assert_equal(__, lst.length, "Single node list has length 1")

def test_multiple_nodes():
    """Understanding list traversal"""
    lst = LinkedList()
    lst.append(1)
    lst.append(2)
    lst.append(3)
    assert_equal(__, lst.get_values(), "Should maintain insertion order")
    assert_equal(__, lst.length, "Length should match number of nodes")

def test_list_operations():
    """Understanding list manipulation"""
    lst = LinkedList()
    lst.append(1)
    lst.append(2)
    values = lst.get_values()
    assert_equal(__, values, "Should be able to get all values")
    assert_equal(__, lst.length, "Length should be accurate")

def main():
    koan = Koan("practice/mastery/linked_list.py")
    koan.add_lesson(test_empty_list, "Empty list properties")
    koan.add_lesson(test_single_node, "Single node operations")
    koan.add_lesson(test_multiple_nodes, "Multiple node operations")
    koan.add_lesson(test_list_operations, "List manipulation")
    
    runner = Runner()
    runner.run_koan(koan)
    runner.show_progress()

if __name__ == "__main__":
    main() 