import time

def time_it(func):
    """
    A decorator that prints the execution time for the decorated function.
    We will use this later to measure our algorithms.
    """
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        elapsed_time = end_time - start_time
        return result, elapsed_time
    return wrapper

# --- Error Handling Utilities ---
def validate_number_list(input_string):
    """
    Parses a string into a list of integers.
    Raises ValueError if invalid.
    """
    try:
        # Handles comma separated or space separated
        cleaned = input_string.replace(',', ' ').split()
        return [int(x) for x in cleaned]
    except ValueError:
        raise ValueError("Invalid input: Please provide a valid list of numbers.")

# --- Search Algorithms (Skeletons) ---
@time_it
def linear_search(arr, target):
    """
    Performs a linear search on a list.
    Returns the index if found, else -1.
    """
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1

@time_it
def binary_search(arr, target):
    """
    Performs a binary search on a SORTED list.
    Returns the index if found, else -1.
    """
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

# --- Subset Algorithms (Skeletons) ---
@time_it
def is_subset_list(collection_a, collection_b):
    """
    Checks if collection_a is a subset of collection_b using List logic O(N * M).
    """
    for item in collection_a:
        if item not in collection_b:
            return False
    return True

@time_it
def is_subset_set(collection_a, collection_b):
    """
    Checks if collection_a is a subset of collection_b using Set logic O(N + M).
    """
    set_a = set(collection_a)
    set_b = set(collection_b)
    return set_a.issubset(set_b)


