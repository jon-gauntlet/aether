from typing import List

def max_sum_subarray(arr: List[int], k: int) -> int:
    window = arr[:k]
    window_sum = sum(window)
    max_sum = window_sum
    print(f"<INITIAL VALUES>\n    k={k}\n    window={window}\n    window_sum={window_sum}\n    max_sum={max_sum}\n")

    print("<BEGIN LOOP SEQUENCE>")
    
    for i in range(k, len(arr)):
        print(f"Loop:")
        print(f"    i={i}")
        print(f"  arr[i]={arr[i]}; arr[i-k]={arr[i-k]}")
        window_sum += arr[i] - arr[i-k]
        print(f"  window_sum={window_sum}")
        max_sum = max(max_sum, window_sum)
        print(f"    max_sum={max_sum}\n")
    
    print("<EXITING LOOP>")
    print(f"Final max_sum={max_sum}")
    return max_sum

arr = [1,2,3,7,12]