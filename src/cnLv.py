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
        if not self.head:
            self.head = Node(value)
        else:
            current = self.head
            while current.next:
                current = current.next
            current.next = Node(value)
        self.length += 1
    
    def get_values(self):
        values = []
        current = self.head
        while current:
            values.append(current.value)
            current = current.next
        return values

def test_empty_list():
    """Understanding empty lists"""
    lst = LinkedList()
    assert_equal(None, lst.head, "Empty list has no head")
    assert_equal(0, lst.length, "Empty list has zero length")

def test_single_node():
    """Understanding single node lists"""
    lst = LinkedList()
    lst.append(42)
    assert_equal(42, lst.head.value, "Head node should contain the value")
    assert_equal(None, lst.head.next, "Single node should point to None")
    assert_equal(1, lst.length, "Single node list has length 1")

def test_multiple_nodes():
    """Understanding list traversal"""
    lst = LinkedList()
    lst.append(1)
    lst.append(2)
    lst.append(3)
    assert_equal([1, 2, 3], lst.get_values(), "Should maintain insertion order")
    assert_equal(3, lst.length, "Length should match number of nodes")

def test_list_operations():
    """Understanding list manipulation"""
    lst = LinkedList()
    lst.append(1)
    lst.append(2)
    values = lst.get_values()
    assert_equal([1, 2], values, "Should be able to get all values")
    assert_equal(2, lst.length, "Length should be accurate")

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