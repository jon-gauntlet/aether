"""
Path to Python Enlightenment - Binary Trees

'And out of the ground the Lord God made every tree grow' (Genesis 2:9)
As a tree grows from root to leaves, we learn the beauty of hierarchical structures.

Topics covered:
- Tree creation
- Tree traversal
- Node insertion
- Tree properties
- Tree operations
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

class TreeNode:
    def __init__(self, value=None):
        self.value = value
        self.left = None
        self.right = None

class BinaryTree:
    def __init__(self):
        self.root = None
    
    def insert(self, value):
        if not self.root:
            self.root = TreeNode(value)
            return
        
        queue = [self.root]
        while queue:
            node = queue.pop(0)
            if not node.left:
                node.left = TreeNode(value)
                return
            if not node.right:
                node.right = TreeNode(value)
                return
            queue.append(node.left)
            queue.append(node.right)
    
    def get_level_order(self):
        if not self.root:
            return []
        
        result = []
        queue = [self.root]
        while queue:
            node = queue.pop(0)
            result.append(node.value)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        return result

def test_empty_tree():
    """Understanding empty trees"""
    tree = BinaryTree()
    assert_equal(None, tree.root, "Empty tree has no root")
    assert_equal([], tree.get_level_order(), "Empty tree has no nodes")

def test_single_node():
    """Understanding root node"""
    tree = BinaryTree()
    tree.insert(42)
    assert_equal(42, tree.root.value, "Root should contain the value")
    assert_equal([42], tree.get_level_order(), "Single node tree")

def test_multiple_nodes():
    """Understanding tree growth"""
    tree = BinaryTree()
    for value in [1, 2, 3]:
        tree.insert(value)
    assert_equal([1, 2, 3], tree.get_level_order(), "Tree should maintain level order")

def test_tree_structure():
    """Understanding tree relationships"""
    tree = BinaryTree()
    tree.insert(1)  # Root
    tree.insert(2)  # Left child
    tree.insert(3)  # Right child
    assert_equal(2, tree.root.left.value, "Left child should be 2")
    assert_equal(3, tree.root.right.value, "Right child should be 3")

def main():
    koan = Koan("practice/mastery/binary_tree.py")
    koan.add_lesson(test_empty_tree, "Empty tree properties")
    koan.add_lesson(test_single_node, "Root node operations")
    koan.add_lesson(test_multiple_nodes, "Multiple node operations")
    koan.add_lesson(test_tree_structure, "Tree relationships")
    
    runner = Runner()
    runner.run_koan(koan)
    runner.show_progress()

if __name__ == "__main__":
    main() 