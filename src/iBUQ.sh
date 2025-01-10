#!/bin/bash

# Create directory structure
mkdir -p resources/{docs,practice,books,algorithms,templates,flashcards,quick_review}

# Clone key repositories focused on quick review and practice
echo "Cloning Python algorithm repositories..."
git clone --depth 1 https://github.com/TheAlgorithms/Python.git resources/algorithms/the-algorithms
git clone --depth 1 https://github.com/keon/algorithms.git resources/algorithms/keon-algorithms
git clone --depth 1 https://github.com/donnemartin/interactive-coding-challenges.git resources/practice/coding-challenges
git clone --depth 1 https://github.com/TSiege/Tech-Interview-Cheat-Sheet.git resources/quick_review/cheat-sheet
git clone --depth 1 https://github.com/mre/the-coding-interview.git resources/practice/coding-interview
git clone --depth 1 https://github.com/zhiwehu/Python-programming-exercises.git resources/practice/python-exercises
git clone --depth 1 https://github.com/PracticeQuestions/codesignal-solutions.git resources/practice/codesignal-examples

# Download focused documentation
echo "Downloading Python documentation..."
cd resources/docs
wget -r -l2 -k -p -np -E -H -D docs.python.org https://docs.python.org/3/library/
wget -r -l2 -k -p -np -E -H -D docs.python.org https://docs.python.org/3/tutorial/datastructures.html
wget -r -l2 -k -p -np -E -H -D docs.python.org https://docs.python.org/3/library/collections.html
wget -r -l2 -k -p -np -E -H -D docs.python.org https://docs.python.org/3/library/heapq.html
cd ../..

# Create flashcards directory with quick review materials
echo "Creating flashcard review system..."
cd resources/flashcards

# Create Python built-in methods flashcards
cat > python_builtins.md << 'EOL'
# Python Built-in Methods Quick Reference

## List Operations
- `list.append(x)` - Add item to end
- `list.extend(iterable)` - Extend list
- `list.insert(i, x)` - Insert at position
- `list.remove(x)` - Remove first occurrence
- `list.pop([i])` - Remove and return item
- `list.sort()` - Sort in place
- `sorted(list)` - Return new sorted list

## String Operations
- `str.split([sep])` - Split into list
- `str.join(iterable)` - Join list into string
- `str.strip()` - Remove whitespace
- `str.replace(old, new)` - Replace substring

## Dictionary Operations
- `dict.get(key[, default])` - Get with default
- `dict.setdefault(key[, default])` - Get or set default
- `dict.items()` - Get key-value pairs
- `dict.keys()` - Get all keys
- `dict.values()` - Get all values

## Set Operations
- `set.add(elem)` - Add element
- `set.remove(elem)` - Remove element
- `set.union(other_set)` - Union of sets
- `set.intersection(other_set)` - Intersection
EOL

# Create time complexity flashcards
cat > time_complexity.md << 'EOL'
# Time Complexity Quick Reference

## Common Operations
- Array/List Access: O(1)
- Array/List Search: O(n)
- Array/List Insertion: O(n)
- Array/List Deletion: O(n)
- Dictionary/Set Access: O(1)
- Dictionary/Set Search: O(1)
- Dictionary/Set Insertion: O(1)
- Dictionary/Set Deletion: O(1)

## Sorting Algorithms
- Quick Sort: O(n log n)
- Merge Sort: O(n log n)
- Heap Sort: O(n log n)
- Bubble Sort: O(n²)
- Insertion Sort: O(n²)
- Selection Sort: O(n²)

## Graph Algorithms
- BFS: O(V + E)
- DFS: O(V + E)
- Dijkstra: O((V + E) log V)
EOL

cd ../..

# Download cheat sheets and templates
echo "Downloading cheat sheets and templates..."
cd resources/templates
curl -O https://raw.githubusercontent.com/jwasham/coding-interview-university/main/extras/cheat%20sheets/Algorithms%20and%20Data%20Structures%20Cheatsheet.pdf
curl -O https://raw.githubusercontent.com/jwasham/coding-interview-university/main/extras/cheat%20sheets/Big-O%20Algorithmic%20Complexity%20Cheatsheet.pdf

# Create ADHD-optimized templates with clear sections and comments
cat > dfs_template.py << 'EOL'
def dfs(graph, start, visited=None):
    """Depth-First Search Template
    Time: O(V + E) where V = vertices, E = edges
    Space: O(V) for visited set
    
    Key Points:
    1. Uses recursion
    2. Marks nodes as visited
    3. Explores as far as possible
    """
    if visited is None:
        visited = set()
    visited.add(start)
    for next_node in graph[start]:
        if next_node not in visited:
            dfs(graph, next_node, visited)
    return visited
EOL

cat > bfs_template.py << 'EOL'
from collections import deque

def bfs(graph, start):
    """Breadth-First Search Template
    Time: O(V + E) where V = vertices, E = edges
    Space: O(V) for queue and visited set
    
    Key Points:
    1. Uses queue (deque)
    2. Explores level by level
    3. Shortest path in unweighted graph
    """
    visited = set([start])
    queue = deque([start])
    while queue:
        vertex = queue.popleft()
        for neighbor in graph[vertex]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
    return visited
EOL

cat > binary_search_template.py << 'EOL'
def binary_search(arr, target):
    """Binary Search Template
    Time: O(log n)
    Space: O(1)
    
    Key Points:
    1. Array must be sorted
    2. Compare target with middle
    3. Eliminate half each time
    """
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = left + (right - left) // 2  # Prevents overflow
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
EOL

cat > sliding_window_template.py << 'EOL'
from collections import defaultdict

def sliding_window(arr, k):
    """Sliding Window Template
    Time: O(n)
    Space: O(k) for window
    
    Key Points:
    1. Initialize window
    2. Process first k elements
    3. Slide window by 1
    4. Update result
    """
    window = defaultdict(int)
    result = []
    
    # 1. Process first k elements
    for i in range(k):
        window[arr[i]] += 1
    
    # 2. Add first window result
    result.append(max(window, key=window.get))
    
    # 3. Slide window
    for i in range(k, len(arr)):
        # Remove element from window start
        window[arr[i-k]] -= 1
        if window[arr[i-k]] == 0:
            del window[arr[i-k]]
        
        # Add new element
        window[arr[i]] += 1
        
        # Update result
        result.append(max(window, key=window.get))
    
    return result
EOL

# Create quick review guide
cat > ../quick_review/codesignal_tips.md << 'EOL'
# CodeSignal Assessment Quick Review

## Time Management (70 minutes)
1. Read all questions first (5 min)
2. Start with easiest question
3. Set time limits per question
4. Leave 10 min for final review

## Common Patterns
1. Array Manipulation
   - Two pointers
   - Sliding window
   - Prefix sums

2. String Processing
   - Split/Join
   - Dictionary counting
   - StringBuilder pattern

3. Tree/Graph Problems
   - DFS/BFS templates
   - Level-order traversal
   - Path finding

## Quick Tips
1. Test edge cases first
2. Use Python built-ins
3. Consider space complexity
4. Comment your code
5. Use descriptive names

## Python Tricks
```python
# List comprehension
[x for x in range(n) if condition]

# Counter for frequency
from collections import Counter
counts = Counter(list)

# DefaultDict for graphs
from collections import defaultdict
graph = defaultdict(list)

# Heap for top-k
import heapq
heapq.heappush(heap, item)
```

## Common Pitfalls
1. Integer overflow
2. Off-by-one errors
3. Null/None checks
4. Modifying while iterating
5. Forgetting to return
EOL

# Create README with ADHD-optimized study guide
cat > ../README.md << 'EOL'
# Python DSA Study Materials (ADHD-Optimized)

## Quick Start (25-minute sessions)
1. Review flashcards (5 min)
2. Solve one easy problem (10 min)
3. Review solution (5 min)
4. Take notes (5 min)

## Directory Structure
- `flashcards/` - Quick review materials
- `quick_review/` - Condensed guides
- `practice/` - Coding problems
- `templates/` - Algorithm templates

## Study Strategy (Pomodoro-based)
1. Session 1: Review one data structure
2. Session 2: Solve related problems
3. Session 3: Optimize solutions
4. Break (15 min)
5. Repeat with new topic

## Focus Areas for CodeSignal
1. Array/String Manipulation
2. Hash Tables and Sets
3. Basic Graph Algorithms
4. Dynamic Programming Basics

## Practice Plan
1. Start with 5 easy problems
2. Time each solution (15 min max)
3. Review optimal solutions
4. Focus on problem-solving patterns
EOL

cd ../..

# Make script executable
chmod +x download_resources.sh

echo "Resource download script created successfully!"
echo "Run ./download_resources.sh to fetch all study materials." 