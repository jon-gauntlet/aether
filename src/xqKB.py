#!/usr/bin/env python3

import time
import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
import heapq
from collections import defaultdict, deque

@dataclass
class ProblemAttempt:
    problem_id: str
    time_taken: float
    successful: bool
    approach_used: str
    mistakes_made: List[str]
    optimization_needed: bool

@dataclass
class SkillAssessment:
    python_basics: float  # 0-100
    data_structures: float
    algorithms: float
    problem_solving: float
    time_management: float
    overall_score: float
    weak_areas: List[str]
    strong_areas: List[str]

class AssessmentTracker:
    def __init__(self, data_file: str = "assessment_data.json"):
        self.data_file = Path(data_file)
        self.attempts: Dict[str, List[ProblemAttempt]] = defaultdict(list)
        self.skills: Optional[SkillAssessment] = None
        self.load_data()

    def load_data(self) -> None:
        """Load assessment data from JSON file."""
        if self.data_file.exists():
            with open(self.data_file) as f:
                data = json.load(f)
                self.attempts = {k: [ProblemAttempt(**a) for a in v]
                               for k, v in data.get('attempts', {}).items()}
                if 'skills' in data:
                    self.skills = SkillAssessment(**data['skills'])

    def save_data(self) -> None:
        """Save assessment data to JSON file."""
        data = {
            'attempts': {k: [asdict(a) for a in v]
                        for k, v in self.attempts.items()},
            'skills': asdict(self.skills) if self.skills else None
        }
        with open(self.data_file, 'w') as f:
            json.dump(data, f, indent=2)

    def record_attempt(self, attempt: ProblemAttempt) -> None:
        """Record a problem attempt."""
        self.attempts[attempt.problem_id].append(attempt)
        self.update_skills()
        self.save_data()

    def update_skills(self) -> None:
        """Update skill assessment based on attempts."""
        if not self.attempts:
            return

        # Calculate success rates and average times
        success_rate = sum(1 for attempts in self.attempts.values()
                          if any(a.successful for a in attempts)) / len(self.attempts)
        avg_time = sum(a.time_taken for attempts in self.attempts.values()
                      for a in attempts) / sum(len(attempts) for attempts in self.attempts.values())

        # Identify patterns in approaches and mistakes
        approaches = defaultdict(int)
        mistakes = defaultdict(int)
        for attempts in self.attempts.values():
            for attempt in attempts:
                approaches[attempt.approach_used] += 1
                for mistake in attempt.mistakes_made:
                    mistakes[mistake] += 1

        # Calculate scores
        self.skills = SkillAssessment(
            python_basics=self._calculate_python_score(),
            data_structures=self._calculate_ds_score(),
            algorithms=self._calculate_algo_score(),
            problem_solving=success_rate * 100,
            time_management=self._calculate_time_score(avg_time),
            overall_score=0,  # Will be calculated
            weak_areas=self._identify_weak_areas(mistakes),
            strong_areas=self._identify_strong_areas(approaches)
        )

        # Calculate overall score
        self.skills.overall_score = (
            self.skills.python_basics * 0.2 +
            self.skills.data_structures * 0.2 +
            self.skills.algorithms * 0.2 +
            self.skills.problem_solving * 0.2 +
            self.skills.time_management * 0.2
        )

    def _calculate_python_score(self) -> float:
        """Calculate Python proficiency score."""
        python_features = {
            'list_comprehension': 0,
            'dictionary_ops': 0,
            'built_ins': 0,
            'standard_lib': 0
        }
        
        for attempts in self.attempts.values():
            for attempt in attempts:
                if 'list_comprehension' in attempt.approach_used:
                    python_features['list_comprehension'] += 1
                if 'dictionary' in attempt.approach_used:
                    python_features['dictionary_ops'] += 1
                if 'built_in' in attempt.approach_used:
                    python_features['built_ins'] += 1
                if any(lib in attempt.approach_used for lib in ['collections', 'heapq', 'itertools']):
                    python_features['standard_lib'] += 1

        total_attempts = len(self.attempts)
        if total_attempts == 0:
            return 0

        return sum(count / total_attempts * 25 for count in python_features.values())

    def _calculate_ds_score(self) -> float:
        """Calculate data structures proficiency score."""
        ds_usage = {
            'array': 0,
            'hash_table': 0,
            'tree': 0,
            'graph': 0
        }

        for attempts in self.attempts.values():
            for attempt in attempts:
                if 'array' in attempt.approach_used:
                    ds_usage['array'] += 1
                if 'hash' in attempt.approach_used or 'dict' in attempt.approach_used:
                    ds_usage['hash_table'] += 1
                if 'tree' in attempt.approach_used:
                    ds_usage['tree'] += 1
                if 'graph' in attempt.approach_used:
                    ds_usage['graph'] += 1

        total_attempts = len(self.attempts)
        if total_attempts == 0:
            return 0

        return sum(count / total_attempts * 25 for count in ds_usage.values())

    def _calculate_algo_score(self) -> float:
        """Calculate algorithms proficiency score."""
        algo_usage = {
            'sorting': 0,
            'searching': 0,
            'dynamic_programming': 0,
            'graph_traversal': 0
        }

        for attempts in self.attempts.values():
            for attempt in attempts:
                if 'sort' in attempt.approach_used:
                    algo_usage['sorting'] += 1
                if 'search' in attempt.approach_used:
                    algo_usage['searching'] += 1
                if 'dp' in attempt.approach_used:
                    algo_usage['dynamic_programming'] += 1
                if 'dfs' in attempt.approach_used or 'bfs' in attempt.approach_used:
                    algo_usage['graph_traversal'] += 1

        total_attempts = len(self.attempts)
        if total_attempts == 0:
            return 0

        return sum(count / total_attempts * 25 for count in algo_usage.values())

    def _calculate_time_score(self, avg_time: float) -> float:
        """Calculate time management score."""
        # Assuming target average time is 15 minutes per problem
        target_time = 15 * 60  # 15 minutes in seconds
        if avg_time <= target_time:
            return 100
        elif avg_time <= target_time * 1.5:
            return 75
        elif avg_time <= target_time * 2:
            return 50
        else:
            return 25

    def _identify_weak_areas(self, mistakes: Dict[str, int]) -> List[str]:
        """Identify areas needing improvement."""
        return [area for area, count in mistakes.items()
                if count >= len(self.attempts) * 0.3]

    def _identify_strong_areas(self, approaches: Dict[str, int]) -> List[str]:
        """Identify areas of strength."""
        return [area for area, count in approaches.items()
                if count >= len(self.attempts) * 0.5]

    def get_next_practice_focus(self) -> Tuple[str, str]:
        """Recommend next area to focus on."""
        if not self.skills:
            return "python_basics", "Start with Python fundamentals"

        scores = {
            "python_basics": (self.skills.python_basics, "Python fundamentals"),
            "data_structures": (self.skills.data_structures, "Data structures"),
            "algorithms": (self.skills.algorithms, "Algorithms"),
            "problem_solving": (self.skills.problem_solving, "Problem-solving strategies"),
            "time_management": (self.skills.time_management, "Time management")
        }

        weakest_area = min(scores.items(), key=lambda x: x[1][0])
        return weakest_area[0], weakest_area[1][1]

    def print_assessment_report(self) -> None:
        """Print detailed assessment report."""
        if not self.skills:
            print("No assessment data available yet.")
            return

        print("\n=== Assessment Report ===")
        print(f"Overall Score: {self.skills.overall_score:.1f}/100")
        print("\nDetailed Scores:")
        print(f"Python Basics: {self.skills.python_basics:.1f}/100")
        print(f"Data Structures: {self.skills.data_structures:.1f}/100")
        print(f"Algorithms: {self.skills.algorithms:.1f}/100")
        print(f"Problem Solving: {self.skills.problem_solving:.1f}/100")
        print(f"Time Management: {self.skills.time_management:.1f}/100")

        print("\nStrong Areas:")
        for area in self.skills.strong_areas:
            print(f"- {area}")

        print("\nAreas Needing Improvement:")
        for area in self.skills.weak_areas:
            print(f"- {area}")

        focus_area, description = self.get_next_practice_focus()
        print(f"\nRecommended Focus: {description}")

def main():
    """Example usage of the AssessmentTracker."""
    tracker = AssessmentTracker()
    
    # Example: Record a problem attempt
    attempt = ProblemAttempt(
        problem_id="two_sum",
        time_taken=600,  # 10 minutes
        successful=True,
        approach_used="hash_table",
        mistakes_made=["initial_brute_force"],
        optimization_needed=False
    )
    
    tracker.record_attempt(attempt)
    tracker.print_assessment_report()

if __name__ == "__main__":
    main() 