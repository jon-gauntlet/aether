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
import subprocess
from pathlib import Path

# Repository structure
REPO_ROOT = Path(__file__).parent
PRACTICE_DIR = REPO_ROOT / "practice"
RESOURCES_DIR = REPO_ROOT / "resources"

class Enlightenment:
    def __init__(self):
        self.topics = {
            "fundamentals": {
                "path": "practice/fundamentals",
                "order": ["variables", "loops", "functions"],
                "description": "Master the basics of Python",
                "requires_internet": False
            },
            "arrays": {
                "path": "practice/easy",
                "order": ["array_sum", "binary_search"],
                "description": "Understanding array operations and searching",
                "requires_internet": False
            },
            "linked_lists": {
                "path": "practice/medium",
                "order": ["singly_linked", "doubly_linked"],
                "description": "Mastering linked structures",
                "requires_internet": False
            }
        }

    def show_progress(self):
        """Display overall progress through the koans"""
        print("\n🗺️  Your Journey:")
        for topic, details in self.topics.items():
            completed = 0
            total = len(details["order"])
            print(f"\n{topic.title()}:")
            print(f"Progress: [{'#' * completed}{'-' * (total - completed)}] {completed}/{total}")
            print(f"Description: {details['description']}")

    def prepare_offline_resources(self):
        """Extract book content for offline use"""
        if os.path.exists("/home/jon/Documents/PDFs/Data Structures and Algorithms in Python.pdf"):
            script_path = REPO_ROOT / "scripts/extract_topic.sh"
            if os.path.exists(script_path):
                subprocess.run([script_path, "all"])
                print("✓ Book content extracted for offline use")

    def suggest_next_steps(self, time_available=20):
        """Suggest what to focus on given available time"""
        print(f"\n⏱️  Making the most of your {time_available} minutes:")
        
        if time_available <= 20:
            print("""
1. Start with array_sum.py (5 minutes):
   python practice/easy/array_sum.py
   - Complete the first two tests
   - Read the extracted book section on arrays

2. Move to binary_search.py (10 minutes):
   python practice/easy/binary_search.py
   - Focus on understanding the algorithm
   - Complete the empty array test

3. Download offline resources (5 minutes):
   - Let the extract_topic.sh script run in background
   - Review downloaded content later
""")

def main():
    enlightenment = Enlightenment()
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "--list":
            enlightenment.show_progress()
            return
        elif sys.argv[1] == "--topic":
            # TODO: Implement topic-specific guidance
            pass
    
    # Default: Show progress and suggest next steps
    print("\n🎯 Welcome to the Path of Python DSA Enlightenment!")
    enlightenment.show_progress()
    
    # Prepare offline resources in background
    enlightenment.prepare_offline_resources()
    
    # Suggest next steps based on 20-minute time block
    enlightenment.suggest_next_steps(20)

if __name__ == "__main__":
    main() 