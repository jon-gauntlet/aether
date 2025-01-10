#!/usr/bin/env python3
"""
Path to Python DSA Enlightenment

This is your guide through the journey of learning Data Structures and Algorithms.
Each step builds upon the previous ones, gradually increasing in complexity.

Usage:
    python path_to_enlightenment.py          # Start the journey
    python path_to_enlightenment.py --topic arrays  # Focus on arrays
    python path_to_enlightenment.py --list   # List all topics
"""

import os
import sys
from pathlib import Path
from src.runner import Runner, Koan

# Repository structure
REPO_ROOT = Path(__file__).parent
KOANS_PATH = REPO_ROOT / "practice"

class PathToEnlightenment:
    def __init__(self):
        self.topics = {
            "fundamentals": {
                "path": KOANS_PATH / "fundamentals",
                "order": ["variables.py", "loops.py", "functions.py"],
                "description": "Master the basics of Python"
            },
            "arrays": {
                "path": KOANS_PATH / "easy",
                "order": ["array_sum.py", "binary_search.py"],
                "description": "Understanding array operations and searching"
            },
            "linked_lists": {
                "path": KOANS_PATH / "medium",
                "order": ["singly_linked.py", "doubly_linked.py"],
                "description": "Mastering linked structures"
            }
        }
        self.runner = Runner()

    def contemplate(self, topic=None):
        """Begin contemplation of a specific topic or all topics"""
        if topic and topic in self.topics:
            self._contemplate_topic(topic)
        else:
            self._contemplate_all()

    def _contemplate_topic(self, topic):
        """Focus on a specific topic"""
        details = self.topics[topic]
        print(f"\n🧘 Contemplating {topic}...")
        print(f"Description: {details['description']}")
        
        for filename in details["order"]:
            path = details["path"] / filename
            if path.exists():
                print(f"\nMeditating on {filename}...")
                module = self._import_koan(path)
                if hasattr(module, "main"):
                    module.main()
            else:
                print(f"⚠️  Cannot find {filename}")

    def _contemplate_all(self):
        """Journey through all topics"""
        print("\n🎯 Beginning the journey to enlightenment...")
        for topic in self.topics:
            self._contemplate_topic(topic)

    def _import_koan(self, path):
        """Import a koan module dynamically"""
        import importlib.util
        spec = importlib.util.spec_from_file_location("koan", path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module

    def show_progress(self):
        """Display progress through the koans"""
        print("\n📊 Your Progress:")
        total_koans = 0
        completed_koans = 0
        
        for topic, details in self.topics.items():
            print(f"\n{topic.title()}:")
            for filename in details["order"]:
                path = details["path"] / filename
                total_koans += 1
                if path.exists():
                    # TODO: Track completion status
                    print(f"  [ ] {filename}")
                else:
                    print(f"  [?] {filename} (not found)")

def main():
    path = PathToEnlightenment()
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "--list":
            path.show_progress()
            return
        elif sys.argv[1] == "--topic" and len(sys.argv) > 2:
            path.contemplate(sys.argv[2])
            return
    
    # Default: Show welcome message and start the journey
    print("""
🌟 Welcome to the Path of Python DSA Enlightenment!

Your journey will take you through:
- Python fundamentals
- Basic data structures
- Essential algorithms
- Problem-solving patterns

Each lesson builds upon the previous ones.
Let the journey begin!
""")
    path.contemplate()

if __name__ == "__main__":
    main() 