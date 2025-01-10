# Python 3 Quick Refresher for CodeSignal DSA

## Key Python Features for DSA

### List Operations
```python
# List comprehension (prefer over loops for clarity)
squares = [x*x for x in range(10)]

# Slicing with stride
arr[start:end:step]  # e.g., arr[::-1] reverses

# Multiple assignment
a, b = b, a  # Swap values

# List methods you'll use often
arr.append(x)    # O(1) amortized
arr.pop()        # O(1) from end
arr.insert(i, x) # O(n)
arr.remove(x)    # O(n)
```

### Dictionary/Set Operations
```python
# Dictionary comprehension
char_count = {char: s.count(char) for char in set(s)}

# Default values
from collections import defaultdict
graph = defaultdict(list)  # No need to check if key exists

# Counter for frequency counting
from collections import Counter
frequencies = Counter(arr)
most_common = frequencies.most_common(1)[0]
```

### Heaps (Priority Queues)
```python
import heapq

# Min heap operations
heapq.heappush(heap, item)  # O(log n)
smallest = heapq.heappop(heap)  # O(log n)
heapq.heapify(list)  # O(n)

# For max heap, negate values
heapq.heappush(max_heap, -item)
largest = -heapq.heappop(max_heap)
```

### Deque (Double-ended Queue)
```python
from collections import deque

# Perfect for BFS and sliding windows
queue = deque()
queue.append(x)      # Add right O(1)
queue.appendleft(x)  # Add left O(1)
queue.pop()         # Remove right O(1)
queue.popleft()     # Remove left O(1)
```

### String Operations
```python
# Join is faster than += for building strings
result = ''.join(['a', 'b', 'c'])

# String methods you'll use often
s.strip()    # Remove whitespace
s.split()    # Split on whitespace
s.split(',') # Split on delimiter
```

### Built-in Functions
```python
# Sorting
sorted(arr)  # Returns new sorted list
arr.sort()   # In-place sort
sorted(arr, key=lambda x: x[1])  # Sort by second element

# Min/Max
min(arr)  # O(n)
max(arr)  # O(n)
min(arr, key=lambda x: x.value)  # Custom comparison

# Others
len(arr)     # Length O(1)
sum(arr)     # Sum O(n)
any(arr)     # True if any True O(n)
all(arr)     # True if all True O(n)
```

## Modern Python Features (3.6+)

### F-strings
```python
value = 42
print(f"The value is {value}")  # Cleaner than .format()
```

### Type Hints (Optional but Helpful)
```python
def binary_search(arr: List[int], target: int) -> int:
    pass
```

### Walrus Operator (:=)
```python
# Assign and test in one line
if (n := len(arr)) > 10:
    print(f"List is too long ({n} elements)")
```

## Common Patterns in CodeSignal

### Two Pointers
```python
def two_sum(arr: List[int], target: int) -> List[int]:
    left, right = 0, len(arr) - 1
    while left < right:
        curr_sum = arr[left] + arr[right]
        if curr_sum == target:
            return [left, right]
        elif curr_sum < target:
            left += 1
        else:
            right -= 1
    return []
```

### Sliding Window
```python
def max_sum_subarray(arr: List[int], k: int) -> int:
    window_sum = sum(arr[:k])
    max_sum = window_sum
    
    for i in range(k, len(arr)):
        window_sum += arr[i] - arr[i-k]
        max_sum = max(max_sum, window_sum)
    
    return max_sum
```

### Hash Table Pattern
```python
def find_duplicates(arr: List[int]) -> List[int]:
    seen = {}
    duplicates = []
    
    for i, num in enumerate(arr):
        if num in seen:
            duplicates.append(num)
        seen[num] = i
    
    return duplicates
```

## Common Pitfalls

1. Mutating While Iterating
```python
# Wrong:
for x in arr:
    if condition:
        arr.remove(x)  # Modifies array during iteration

# Right:
arr = [x for x in arr if not condition]
```

2. List Reference vs Copy
```python
# Creates reference
wrong = [[] for _ in range(n)]

# Creates independent lists
right = [[] for _ in range(n)]

# ACTUALLY THESE ARE THE SAME
```

3. Default Mutable Arguments
```python
# Wrong:
def func(arr=[]):  # arr is shared between calls
    arr.append(1)
    return arr

# Right:
def func(arr=None):
    if arr is None:
        arr = []
    arr.append(1)
    return arr
```

## Time Complexity Cheat Sheet

### List Operations
- Append: O(1) amortized
- Pop last: O(1)
- Pop intermediate: O(n)
- Insert: O(n)
- Get item: O(1)
- Slice: O(k) where k is slice size
- Sort: O(n log n)

### Dictionary Operations
- Get/Set item: O(1) average
- Delete item: O(1) average
- Iteration: O(n)

### Set Operations
- Add/Remove: O(1) average
- Membership test: O(1) average
- Union/Intersection: O(min(len(s), len(t)))

Remember:
- Use built-in functions when possible
- Consider space complexity
- Test edge cases
- Time your solutions 