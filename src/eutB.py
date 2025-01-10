from typing import List

def max_sum_subarray(arr: List[int], k: int) -> int:
    window = arr[:k]
    window_sum = sum(window)
    max_sum = window_sum
    print(f"initial values:\n    k={k}\n    window={window}\n    window_sum={window_sum}\n    max_sum={max_sum}\n")

    print("entering loop...")
    
    for i in range(k, len(arr)):
        print(f"  k={k}; i={i}")
        print(f"  arr[i]={arr[i]}; arr[i-k]={arr[i-k]}")
        window_sum += arr[i] - arr[i-k]
        print(f"  current window_sum={window_sum}")
        max_sum = max(max_sum, window_sum)
        print(f"end_iteration: max_sum={max_sum}\n")
    
    print("exiting loop...")
    print(f"Final max_sum={max_sum}")
    return max_sum