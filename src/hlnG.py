#!/usr/bin/env python3

import time
import sys
import signal
from typing import Callable, Any, List, Dict
from dataclasses import dataclass
import json
from pathlib import Path

@dataclass
class TestCase:
    input_data: Dict[str, Any]
    expected_output: Any
    time_limit: float = 4.0  # seconds

class MockTest:
    def __init__(self, test_name: str):
        self.test_name = test_name
        self.start_time = 0.0
        self.total_time = 0.0
        self.results: List[Dict[str, Any]] = []
        self.current_test: int = 0

    def time_handler(self, signum, frame):
        """Handle timeout signal."""
        raise TimeoutError(f"Solution took longer than {self.current_test_case.time_limit} seconds")

    def run_test(self, solution_func: Callable, test_cases: List[TestCase]) -> None:
        """Run the solution against all test cases."""
        self.start_time = time.time()
        
        print(f"\nRunning Mock Test: {self.test_name}")
        print("=" * 50)

        for i, test_case in enumerate(test_cases, 1):
            self.current_test = i
            self.current_test_case = test_case
            
            print(f"\nTest Case {i}:")
            print(f"Input: {test_case.input_data}")
            
            # Set up timeout handler
            signal.signal(signal.SIGALRM, self.time_handler)
            signal.alarm(int(test_case.time_limit))

            try:
                # Run solution and measure time
                case_start = time.time()
                output = solution_func(**test_case.input_data)
                case_time = time.time() - case_start

                # Check result
                is_correct = output == test_case.expected_output
                
                self.results.append({
                    'test_case': i,
                    'passed': is_correct,
                    'time': case_time,
                    'output': output,
                    'expected': test_case.expected_output
                })

                # Print result
                print(f"Your Output: {output}")
                print(f"Expected: {test_case.expected_output}")
                print(f"Time: {case_time:.2f} seconds")
                print(f"Status: {'✓ Passed' if is_correct else '✗ Failed'}")

            except TimeoutError as e:
                print(f"Error: {e}")
                self.results.append({
                    'test_case': i,
                    'passed': False,
                    'time': test_case.time_limit,
                    'error': 'Time Limit Exceeded'
                })

            except Exception as e:
                print(f"Error: {e}")
                self.results.append({
                    'test_case': i,
                    'passed': False,
                    'time': time.time() - case_start,
                    'error': str(e)
                })

            finally:
                signal.alarm(0)

        self.total_time = time.time() - self.start_time
        self._print_summary()
        self._save_results()

    def _print_summary(self) -> None:
        """Print test summary."""
        passed = sum(1 for r in self.results if r.get('passed', False))
        total = len(self.results)
        
        print("\n" + "=" * 50)
        print("Test Summary:")
        print(f"Passed: {passed}/{total} test cases")
        print(f"Total Time: {self.total_time:.2f} seconds")
        
        if passed == total:
            print("\nCongratulations! All test cases passed!")
        else:
            print("\nSome test cases failed. Review the results above.")

    def _save_results(self) -> None:
        """Save test results to file."""
        results_dir = Path("quiz/results")
        results_dir.mkdir(exist_ok=True)
        
        result_data = {
            'test_name': self.test_name,
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
            'total_time': self.total_time,
            'results': self.results
        }
        
        with open(results_dir / f"{self.test_name}_{int(time.time())}.json", 'w') as f:
            json.dump(result_data, f, indent=2)

def example_solution(nums: List[int], target: int) -> List[int]:
    """Example solution for Two Sum problem."""
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

def main():
    """Example usage of MockTest."""
    # Define test cases
    test_cases = [
        TestCase(
            input_data={'nums': [2, 7, 11, 15], 'target': 9},
            expected_output=[0, 1]
        ),
        TestCase(
            input_data={'nums': [3, 2, 4], 'target': 6},
            expected_output=[1, 2]
        ),
        TestCase(
            input_data={'nums': [3, 3], 'target': 6},
            expected_output=[0, 1]
        )
    ]

    # Run mock test
    mock_test = MockTest("Two Sum")
    mock_test.run_test(example_solution, test_cases)

if __name__ == "__main__":
    main() 