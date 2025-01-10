#!/usr/bin/env python3

import time
import json
from pathlib import Path
from typing import Dict, List, Any, Callable, Optional
from dataclasses import dataclass
import random
from enum import Enum

class Difficulty(Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

@dataclass
class Problem:
    id: str
    title: str
    description: str
    difficulty: Difficulty
    category: str
    examples: List[Dict[str, Any]]
    test_cases: List[Dict[str, Any]]
    hints: List[str]
    solution_template: str
    optimal_solution: str
    time_complexity: str
    space_complexity: str
    common_mistakes: List[str]
    follow_up: Optional[str] = None

class InteractiveProblemSet:
    def __init__(self, problems_dir: str = "practice/problems"):
        self.problems_dir = Path(problems_dir)
        self.problems: Dict[str, Problem] = {}
        self.user_progress: Dict[str, Dict[str, Any]] = {}
        self.load_problems()
        self.load_progress()

    def load_problems(self) -> None:
        """Load problems from JSON files."""
        if not self.problems_dir.exists():
            self._create_sample_problems()
        
        for problem_file in self.problems_dir.glob("*.json"):
            with open(problem_file) as f:
                data = json.load(f)
                self.problems[data["id"]] = Problem(**data)

    def _create_sample_problems(self) -> None:
        """Create sample problems if none exist."""
        self.problems_dir.mkdir(parents=True, exist_ok=True)
        
        sample_problems = [
            {
                "id": "two_sum",
                "title": "Two Sum",
                "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
                "difficulty": Difficulty.EASY,
                "category": "array",
                "examples": [
                    {
                        "input": {"nums": [2, 7, 11, 15], "target": 9},
                        "output": [0, 1],
                        "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
                    }
                ],
                "test_cases": [
                    {"input": {"nums": [2, 7, 11, 15], "target": 9}, "output": [0, 1]},
                    {"input": {"nums": [3, 2, 4], "target": 6}, "output": [1, 2]},
                    {"input": {"nums": [3, 3], "target": 6}, "output": [0, 1]}
                ],
                "hints": [
                    "Can you use extra space to optimize time complexity?",
                    "Think about using a hash table to store seen values",
                    "For each number, check if its complement exists in the hash table"
                ],
                "solution_template": """def two_sum(nums: List[int], target: int) -> List[int]:
    # Your code here
    pass""",
                "optimal_solution": """def two_sum(nums: List[int], target: int) -> List[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []""",
                "time_complexity": "O(n)",
                "space_complexity": "O(n)",
                "common_mistakes": [
                    "Using nested loops (O(n²) solution)",
                    "Not handling duplicate values",
                    "Returning wrong indices"
                ],
                "follow_up": "Can you do it in one pass?"
            }
        ]

        for problem in sample_problems:
            with open(self.problems_dir / f"{problem['id']}.json", 'w') as f:
                json.dump(problem, f, indent=2)

    def load_progress(self) -> None:
        """Load user progress from file."""
        progress_file = Path("quiz/progress.json")
        if progress_file.exists():
            with open(progress_file) as f:
                self.user_progress = json.load(f)

    def save_progress(self) -> None:
        """Save user progress to file."""
        progress_file = Path("quiz/progress.json")
        progress_file.parent.mkdir(exist_ok=True)
        with open(progress_file, 'w') as f:
            json.dump(self.user_progress, f, indent=2)

    def get_next_problem(self) -> Problem:
        """Get next problem based on user progress."""
        # Calculate problem weights based on difficulty and past attempts
        weights = {}
        for pid, problem in self.problems.items():
            progress = self.user_progress.get(pid, {})
            attempts = progress.get("attempts", 0)
            successes = progress.get("successes", 0)
            
            # Base weight on difficulty
            weight = {
                Difficulty.EASY: 1.0,
                Difficulty.MEDIUM: 0.6,
                Difficulty.HARD: 0.3
            }[problem.difficulty]
            
            # Adjust weight based on past performance
            if attempts > 0:
                success_rate = successes / attempts
                weight *= (1 - success_rate)  # Lower weight for mastered problems
            
            weights[pid] = max(0.1, weight)  # Ensure minimum weight
        
        # Select problem using weighted random choice
        total_weight = sum(weights.values())
        r = random.uniform(0, total_weight)
        cumulative_weight = 0
        
        for pid, weight in weights.items():
            cumulative_weight += weight
            if r <= cumulative_weight:
                return self.problems[pid]
        
        return random.choice(list(self.problems.values()))

    def check_solution(self, problem_id: str, solution_func: Callable) -> Dict[str, Any]:
        """Check user's solution against test cases."""
        problem = self.problems[problem_id]
        results = []
        total_time = 0
        passed = 0

        for test_case in problem.test_cases:
            start_time = time.time()
            try:
                output = solution_func(**test_case["input"])
                end_time = time.time()
                
                is_correct = output == test_case["output"]
                if is_correct:
                    passed += 1
                
                results.append({
                    "input": test_case["input"],
                    "expected": test_case["output"],
                    "actual": output,
                    "passed": is_correct,
                    "time": end_time - start_time
                })
                
                total_time += end_time - start_time
                
            except Exception as e:
                results.append({
                    "input": test_case["input"],
                    "error": str(e),
                    "passed": False
                })

        # Update progress
        if problem_id not in self.user_progress:
            self.user_progress[problem_id] = {"attempts": 0, "successes": 0}
        
        self.user_progress[problem_id]["attempts"] += 1
        if passed == len(problem.test_cases):
            self.user_progress[problem_id]["successes"] += 1
        
        self.save_progress()

        return {
            "passed": passed,
            "total": len(problem.test_cases),
            "results": results,
            "total_time": total_time,
            "hints": problem.hints if passed < len(problem.test_cases) else [],
            "common_mistakes": problem.common_mistakes,
            "optimal_solution": problem.optimal_solution if passed < len(problem.test_cases) else None
        }

def main():
    """Example usage of InteractiveProblemSet."""
    problem_set = InteractiveProblemSet()
    
    # Get next problem
    problem = problem_set.get_next_problem()
    print(f"\nProblem: {problem.title}")
    print(f"Difficulty: {problem.difficulty.value}")
    print("\nDescription:")
    print(problem.description)
    print("\nExamples:")
    for i, example in enumerate(problem.examples, 1):
        print(f"\nExample {i}:")
        print(f"Input: {example['input']}")
        print(f"Output: {example['output']}")
        if "explanation" in example:
            print(f"Explanation: {example['explanation']}")
    
    print("\nTemplate:")
    print(problem.solution_template)
    
    # Example solution check
    def example_solution(nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        return []
    
    results = problem_set.check_solution("two_sum", example_solution)
    
    print("\nResults:")
    print(f"Passed: {results['passed']}/{results['total']} test cases")
    print(f"Total time: {results['total_time']:.2f} seconds")
    
    if results['hints']:
        print("\nHints:")
        for hint in results['hints']:
            print(f"- {hint}")

if __name__ == "__main__":
    main() 