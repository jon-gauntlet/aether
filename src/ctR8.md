# DSA Optimization Guide

## Common Patterns and Optimizations

### 1. Array/String Problems

#### Two Pointers Pattern
```python
# Before Optimization
def find_pair(arr, target):  # O(n²)
    for i in range(len(arr)):
        for j in range(i+1, len(arr)):
            if arr[i] + arr[j] == target:
                return [i, j]

# After Optimization
def find_pair(arr, target):  # O(n)
    seen = {}
    for i, num in enumerate(arr):
        if target - num in seen:
            return [seen[target-num], i]
        seen[num] = i
```

Key Optimizations:
- Use hash table for O(1) lookups
- Single pass through array
- Space-time tradeoff

#### Sliding Window
```python
# Before Optimization
def max_sum_subarray(arr, k):  # O(n*k)
    max_sum = float('-inf')
    for i in range(len(arr)-k+1):
        curr_sum = sum(arr[i:i+k])
        max_sum = max(max_sum, curr_sum)

# After Optimization
def max_sum_subarray(arr, k):  # O(n)
    window_sum = sum(arr[:k])
    max_sum = window_sum
    
    for i in range(k, len(arr)):
        window_sum += arr[i] - arr[i-k]
        max_sum = max(max_sum, window_sum)
```

Key Optimizations:
- Maintain running sum
- Only update changed elements
- Avoid recalculating

### 2. String Manipulation

#### String Building
```python
# Before Optimization
def build_string(chars):  # O(n²)
    result = ""
    for char in chars:
        result += char

# After Optimization
def build_string(chars):  # O(n)
    return ''.join(chars)
```

Key Optimizations:
- Use join() instead of +=
- Build list then join
- Avoid string concatenation

### 3. Hash Table Usage

#### Frequency Counting
```python
# Before Optimization
def count_freq(arr):  # More code, more error-prone
    freq = {}
    for num in arr:
        if num in freq:
            freq[num] += 1
        else:
            freq[num] = 1

# After Optimization
from collections import Counter
def count_freq(arr):  # Cleaner, built-in optimization
    return Counter(arr)
```

Key Optimizations:
- Use Counter for frequency counting
- Use defaultdict for default values
- Leverage built-in methods

### 4. Tree Traversal

#### DFS Implementation
```python
# Before Optimization (Recursive)
def dfs(root):  # Can cause stack overflow
    if not root:
        return
    print(root.val)
    dfs(root.left)
    dfs(root.right)

# After Optimization (Iterative)
def dfs(root):  # O(n) time, O(h) space
    stack = [root]
    while stack:
        node = stack.pop()
        if node:
            print(node.val)
            stack.append(node.right)
            stack.append(node.left)
```

Key Optimizations:
- Use iterative approach for large trees
- Manage stack space
- Handle edge cases

### 5. Graph Algorithms

#### BFS Implementation
```python
# Before Optimization
def bfs(graph, start):  # Using list as queue
    visited = set([start])
    queue = [start]
    while queue:
        node = queue.pop(0)  # O(n) operation
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)

# After Optimization
from collections import deque
def bfs(graph, start):  # Using deque
    visited = set([start])
    queue = deque([start])
    while queue:
        node = queue.popleft()  # O(1) operation
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
```

Key Optimizations:
- Use deque for O(1) operations
- Use set for O(1) lookups
- Minimize data structure operations

### 6. Dynamic Programming

#### Memoization
```python
# Before Optimization
def fib(n):  # O(2ⁿ)
    if n <= 1:
        return n
    return fib(n-1) + fib(n-2)

# After Optimization
def fib(n, memo=None):  # O(n)
    if memo is None:
        memo = {}
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fib(n-1, memo) + fib(n-2, memo)
    return memo[n]
```

Key Optimizations:
- Use memoization to cache results
- Avoid recalculating values
- Use bottom-up when possible

## General Optimization Tips

1. Time Complexity
   - Identify bottlenecks
   - Look for nested loops
   - Consider space-time tradeoffs

2. Space Complexity
   - Reuse existing space
   - Clear unnecessary storage
   - Consider in-place modifications

3. Python-Specific
   - Use built-in functions
   - Leverage standard library
   - Choose appropriate data structures

4. Edge Cases
   - Empty input
   - Single element
   - Duplicate values
   - Negative numbers
   - Overflow/underflow

5. Code Quality
   - Clear variable names
   - Meaningful comments
   - Handle errors gracefully

## Common Optimization Patterns

1. Space-Time Tradeoff
   - Hash tables for O(1) lookup
   - Precomputation
   - Caching results

2. Two Pointers
   - Array manipulation
   - String problems
   - Linked list operations

3. Sliding Window
   - Subarrays/substrings
   - Fixed size windows
   - Variable size windows

4. Divide and Conquer
   - Binary search
   - Merge sort
   - Quick sort

5. Dynamic Programming
   - Memoization
   - Tabulation
   - State optimization

Remember:
- Always measure performance
- Consider constraints
- Test edge cases
- Document optimizations 