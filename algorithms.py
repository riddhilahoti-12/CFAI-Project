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

class BTreeNode:
    def __init__(self, leaf=True):
        self.leaf = leaf
        self.keys = []  # list of (val, index)
        self.children = []  # list of BTreeNode pointers

class BTree:
    def __init__(self, t=3):
        self.root = BTreeNode(True)
        self.t = t

    def insert(self, val, index):
        root = self.root
        if len(root.keys) == (2 * self.t) - 1:
            temp = BTreeNode(False)
            self.root = temp
            temp.children.insert(0, root)
            self.split_child(temp, 0)
            self.insert_non_full(temp, val, index)
        else:
            self.insert_non_full(root, val, index)

    def split_child(self, x, i):
        t = self.t
        y = x.children[i]
        z = BTreeNode(y.leaf)
        x.children.insert(i + 1, z)
        x.keys.insert(i, y.keys[t - 1])
        z.keys = y.keys[t : (2 * t - 1)]
        y.keys = y.keys[0 : (t - 1)]
        if not y.leaf:
            z.children = y.children[t : (2 * t)]
            y.children = y.children[0 : t]

    def insert_non_full(self, x, val, index):
        i = len(x.keys) - 1
        if x.leaf:
            x.keys.append((None, None))
            while i >= 0 and val < x.keys[i][0]:
                x.keys[i + 1] = x.keys[i]
                i -= 1
            x.keys[i + 1] = (val, index)
        else:
            while i >= 0 and val < x.keys[i][0]:
                i -= 1
            i += 1
            if len(x.children[i].keys) == (2 * self.t) - 1:
                self.split_child(x, i)
                if val > x.keys[i][0]:
                    i += 1
            self.insert_non_full(x.children[i], val, index)

def btree_search_node(node, target):
    i = 0
    while i < len(node.keys) and target > node.keys[i][0]:
        i += 1
    if i < len(node.keys) and target == node.keys[i][0]:
        return node.keys[i][1]
    if node.leaf:
        return -1
    return btree_search_node(node.children[i], target)

def build_btree(arr, t=3):
    if not arr:
        return None
    btree = BTree(t)
    for i, val in enumerate(arr):
        btree.insert(val, i)
    return btree.root

@time_it
def btree_search(root: BTreeNode, target: int) -> int:
    """
    Performs a search on a B-Tree.
    Returns the index if found, else -1.
    """
    if not root:
        return -1
    return btree_search_node(root, target)


# --- AVL Tree Algorithms ---
class AVLNode:
    def __init__(self, val, index):
        self.val = val
        self.index = index
        self.left = None
        self.right = None
        self.height = 1

def get_height(node):
    if not node:
        return 0
    return node.height

def get_balance(node):
    if not node:
        return 0
    return get_height(node.left) - get_height(node.right)

def right_rotate(y):
    x = y.left
    T2 = x.right
    x.right = y
    y.left = T2
    y.height = 1 + max(get_height(y.left), get_height(y.right))
    x.height = 1 + max(get_height(x.left), get_height(x.right))
    return x

def left_rotate(x):
    y = x.right
    T2 = y.left
    y.left = x
    x.right = T2
    x.height = 1 + max(get_height(x.left), get_height(x.right))
    y.height = 1 + max(get_height(y.left), get_height(y.right))
    return y

def avl_insert(node, val, index):
    if not node:
        return AVLNode(val, index)
        
    if val < node.val:
        node.left = avl_insert(node.left, val, index)
    elif val > node.val:
        node.right = avl_insert(node.right, val, index)
    else:
        # Equal values, handle by ignoring or attaching left. Ignore for simplicity.
        return node
        
    node.height = 1 + max(get_height(node.left), get_height(node.right))
    balance = get_balance(node)
    
    # Left Left Case
    if balance > 1 and val < node.left.val:
        return right_rotate(node)
        
    # Right Right Case
    if balance < -1 and val > node.right.val:
        return left_rotate(node)
        
    # Left Right Case
    if balance > 1 and val > node.left.val:
        node.left = left_rotate(node.left)
        return right_rotate(node)
        
    # Right Left Case
    if balance < -1 and val < node.right.val:
        node.right = right_rotate(node.right)
        return left_rotate(node)
        
    return node

def build_avl(arr):
    if not arr:
        return None
    root = None
    for i, val in enumerate(arr):
        root = avl_insert(root, val, i)
    return root

@time_it
def avl_search(root: AVLNode, target: int) -> int:
    """
    Performs a search on an AVL Tree.
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

@time_it
def is_subset_bitmask(collection_a, collection_b):
    """
    Checks if collection_a is a subset of collection_b using bitmask logic.
    """
    mapping = {}
    bit_index = 0
    for x in collection_b:
        if x not in mapping:
            mapping[x] = bit_index
            bit_index += 1
            
    mask_b = 0
    for x in collection_b:
        mask_b |= (1 << mapping[x])
        
    mask_a = 0
    for x in collection_a:
        if x not in mapping:
            return False
        mask_a |= (1 << mapping[x])
        
    return (mask_a & mask_b) == mask_a


