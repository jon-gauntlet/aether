def max_sum_subarray(arr: List[int], k: int) -> int:
    print(f"k={k}")
    window_sum = sum(arr[:k])
    print(f"window_sum={window_sum}")
    max_sum = window_sum
    print(f"initial max_sum={max_sum}")
    
    for i in range(k, len(arr)):
        print(f"for loop: k={k}; i={i}")
        print(f"arr[i]={arr[i]}; arr[i-k]={arr[i-k]}")
        window_sum += arr[i] - arr[i-k]
        max_sum = max(max_sum, window_sum)
    
    return max_sum