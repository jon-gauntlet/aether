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
import importlib.util
import traceback

# Add repository root to Python path
REPO_ROOT = Path(__file__).parent.absolute()
sys.path.insert(0, str(REPO_ROOT))

try:
    from src import Runner, Koan
except ImportError as e:
    print("Error importing core modules. Please ensure you're in the correct directory.")
    print(f"Error details: {e}")
    sys.exit(1)

# Repository structure
KOANS_PATH = REPO_ROOT / "practice"

class PathToEnlightenment:
    def __init__(self):
        self.topics = {
            "foundations": {
                "path": KOANS_PATH / "foundations",
                "order": ["variables.py", "loops.py", "functions.py"],
                "description": "Master the basics of Python"
            },
            "journey": {
                "path": KOANS_PATH / "journey/easy",
                "order": ["array_sum.py", "binary_search.py"],
                "description": "Understanding array operations and searching"
            },
            "mastery": {
                "path": KOANS_PATH / "mastery",
                "order": ["linked_list.py", "binary_tree.py"],
                "description": "Advanced data structures"
            }
        }
        self.runner = Runner()

    def contemplate(self, topic=None):
        """Begin contemplation of a specific topic or all topics"""
        try:
            if topic and topic in self.topics:
                self._contemplate_topic(topic)
            else:
                self._contemplate_all()
        except KeyboardInterrupt:
            print("\n\nMeditation paused. Your progress is saved.")
            sys.exit(0)
        except Exception as e:
            print(f"\n⚠️  Error during contemplation: {e}")
            print("\nTraceback for debugging:")
            traceback.print_exc()
            sys.exit(1)

    def _contemplate_topic(self, topic):
        """Focus on a specific topic"""
        details = self.topics[topic]
        print(f"\n🧘 Contemplating {topic}...")
        print(f"Description: {details['description']}")
        
        topic_path = details["path"]
        if not topic_path.exists():
            print(f"⚠️  Topic path {topic_path} does not exist!")
            return
        
        for filename in details["order"]:
            path = topic_path / filename
            if path.exists():
                print(f"\nMeditating on {filename}...")
                try:
                    module = self._import_koan(path)
                    if hasattr(module, "main"):
                        module.main()
                except Exception as e:
                    print(f"⚠️  Error in {filename}: {e}")
                    traceback.print_exc()
            else:
                print(f"⚠️  Cannot find {filename}")

    def _contemplate_all(self):
        """Journey through all topics"""
        print("\n🎯 Beginning the journey to enlightenment...")
        for topic in self.topics:
            self._contemplate_topic(topic)

    def _import_koan(self, path):
        """Import a koan module dynamically"""
        try:
            spec = importlib.util.spec_from_file_location("koan", path)
            if spec is None:
                raise ImportError(f"Could not load spec for {path}")
            
            module = importlib.util.module_from_spec(spec)
            sys.modules["koan"] = module
            spec.loader.exec_module(module)
            return module
        except Exception as e:
            raise ImportError(f"Failed to import {path}: {e}")

    def show_progress(self):
        """Display progress through the koans"""
        print("\n📊 Your Progress:")
        total_koans = 0
        completed_koans = 0
        
        for topic, details in self.topics.items():
            print(f"\n{topic.title()}:")
            topic_path = details["path"]
            if not topic_path.exists():
                print(f"  ⚠️  Topic path {topic_path} does not exist!")
                continue
                
            for filename in details["order"]:
                path = topic_path / filename
                total_koans += 1
                if path.exists():
                    # TODO: Track completion status
                    print(f"  [ ] {filename}")
                else:
                    print(f"  [?] {filename} (not found)")

def main():
    try:
        path = PathToEnlightenment()
        
        if len(sys.argv) > 1:
            if sys.argv[1] == "--list":
                path.show_progress()
                return
            elif sys.argv[1] == "--topic" and len(sys.argv) > 2:
                path.contemplate(sys.argv[2])
                return
            else:
                print("Invalid arguments. Usage:")
                print("  python path_to_enlightenment.py          # Start the journey")
                print("  python path_to_enlightenment.py --topic arrays  # Focus on arrays")
                print("  python path_to_enlightenment.py --list   # List all topics")
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
    except KeyboardInterrupt:
        print("\n\nJourney paused. Your progress is saved.")
        sys.exit(0)
    except Exception as e:
        print(f"\n⚠️  An error occurred: {e}")
        print("\nTraceback for debugging:")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main() 