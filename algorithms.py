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
    Raises ValueError if invalid or empty.
    """
    if not input_string or not input_string.strip():
        raise ValueError("Input cannot be empty. Please provide a valid list of numbers.")
    try:
        # Handles comma separated or space separated
        cleaned = input_string.replace(',', ' ').split()
        if not cleaned:
            raise ValueError("No valid numbers found in the input.")
        return [int(x) for x in cleaned]
    except ValueError as e:
        # Re-raise the custom message if it's already generated, otherwise generic message
        if "No valid numbers" in str(e):
            raise
        raise ValueError("Invalid format: Please provide only integer values separated by commas or spaces.")

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

@time_it
def hash_search(hash_table, target):
    """
    Performs a search using a hash table (dict).
    Returns the index if found, else -1.
    """
    return hash_table.get(target, -1)

@time_it
def exponential_search(arr, target):
    """
    Performs an exponential search on a SORTED list.
    Returns the index if found, else -1.
    """
    if not arr:
        return -1
    if arr[0] == target:
        return 0
    
    n = len(arr)
    i = 1
    while i < n and arr[i] <= target:
        i = i * 2
    
    # Binary search within the range
    left = i // 2
    right = min(i, n - 1)
    
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
            
    return -1

# --- BST Algorithms ---
class TreeNode:
    def __init__(self, val, index):
        self.val = val
        self.index = index
        self.left = None
        self.right = None

def build_bst(arr):
    if not arr:
        return None
    root = TreeNode(arr[0], 0)
    for i in range(1, len(arr)):
        val = arr[i]
        curr = root
        while True:
            if val < curr.val:
                if curr.left is None:
                    curr.left = TreeNode(val, i)
                    break
                curr = curr.left
            else:
                if curr.right is None:
                    curr.right = TreeNode(val, i)
                    break
                curr = curr.right
    return root

@time_it
def bst_search(root: TreeNode, target: int) -> int:
    """
    Performs a search on a Binary Search Tree.
    Returns the index if found, else -1.
    """
    curr = root
    while curr:
        if curr.val == target:
            return curr.index
        elif target < curr.val:
            curr = curr.left
        else:
            curr = curr.right
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


