#!/bin/bash

# Create directory structure
mkdir -p resources/{docs,practice,books,algorithms,templates}

# Clone key repositories
echo "Cloning Python algorithm repositories..."
git clone https://github.com/TheAlgorithms/Python.git resources/algorithms/the-algorithms
git clone https://github.com/keon/algorithms.git resources/algorithms/keon-algorithms
git clone https://github.com/donnemartin/interactive-coding-challenges.git resources/practice/coding-challenges

# Download Python documentation
echo "Downloading Python documentation..."
cd resources/docs
wget -r -l2 -k -p -np -E -H -D docs.python.org https://docs.python.org/3/library/
wget -r -l2 -k -p -np -E -H -D docs.python.org https://docs.python.org/3/tutorial/datastructures.html
wget -r -l2 -k -p -np -E -H -D docs.python.org https://docs.python.org/3/library/collections.html
wget -r -l2 -k -p -np -E -H -D docs.python.org https://docs.python.org/3/library/heapq.html
cd ../..

# Download cheat sheets and templates
echo "Downloading cheat sheets and templates..."
cd resources/templates
curl -O https://raw.githubusercontent.com/jwasham/coding-interview-university/main/extras/cheat%20sheets/Algorithms%20and%20Data%20Structures%20Cheatsheet.pdf
curl -O https://raw.githubusercontent.com/jwasham/coding-interview-university/main/extras/cheat%20sheets/Big-O%20Algorithmic%20Complexity%20Cheatsheet.pdf

# Create common algorithm templates
cat > dfs_template.py << 'EOL'
def dfs(graph, start, visited=None):
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
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
EOL

cat > two_pointers_template.py << 'EOL'
def two_pointers(arr):
    left, right = 0, len(arr) - 1
    while left < right:
        # Process elements from both ends
        # Adjust pointers based on conditions
        left += 1
        right -= 1
EOL

cat > sliding_window_template.py << 'EOL'
def sliding_window(arr, k):
    window = {}  # or deque() based on needs
    result = []
    
    # Initialize window with first k elements
    for i in range(k):
        # Process first k elements
        pass
        
    # Slide window through rest of array
    for i in range(k, len(arr)):
        # Add new element
        # Remove element from window start
        # Update result
        pass
        
    return result
EOL

# Create README with study guide
cat > ../README.md << 'EOL'
# Python DSA Study Materials

## Directory Structure
- `resources/docs/` - Python official documentation
- `resources/practice/` - Practice problems and challenges
- `resources/books/` - Reference materials
- `resources/algorithms/` - Algorithm implementations
- `resources/templates/` - Common algorithm templates

## Key Topics to Focus
1. Data Structures
   - Arrays and Strings
   - Hash Tables
   - Trees and Graphs
   - Heaps
   - Stacks and Queues

2. Algorithms
   - Binary Search
   - DFS/BFS
   - Two Pointers
   - Sliding Window
   - Dynamic Programming

3. Common Patterns
   - In-place operations
   - Multiple pointers
   - Fast & slow pointers
   - Merge intervals
   - Top K elements

## Study Strategy
1. Start with basic data structure implementations
2. Practice easy problems first
3. Focus on one pattern at a time
4. Time your problem-solving sessions
5. Review and optimize solutions

## Resources
- Python official documentation
- Interactive coding challenges
- Algorithm implementations
- Cheat sheets and templates

## Practice Plan
1. Implement each data structure from scratch
2. Solve 2-3 problems for each pattern
3. Review time/space complexity for each solution
4. Practice explaining solutions out loud
EOL

cd ../..

# Make script executable
chmod +x download_resources.sh

echo "Resource download script created successfully!"
echo "Run ./download_resources.sh to fetch all study materials." 