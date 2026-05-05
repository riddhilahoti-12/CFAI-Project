from flask import Flask, render_template, request, jsonify
from algorithms import linear_search, binary_search, hash_search, bst_search, build_bst, is_subset_list, is_subset_set, validate_number_list, exponential_search, build_avl, avl_search

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/search', methods=['POST'])
def compare_search():
    try:
        data = request.get_json()
        target = int(data.get('target', 0))
        arr = validate_number_list(data.get('array', ''))
        
        # Ensure array is sorted for binary search
        arr.sort()
        
        # Create hash table for O(1) search
        hash_table = {val: idx for idx, val in enumerate(arr)}
        
        # Build BST for O(log N) search
        # Note: Building BST takes time, but we only time the search
        bst_root = build_bst(arr)
        
        # Build AVL
        avl_root = build_avl(arr)
        
        # Run algorithms
        linear_res, linear_time = linear_search(arr, target)
        binary_res, binary_time = binary_search(arr, target)
        hash_res, hash_time = hash_search(hash_table, target)
        bst_res, bst_time = bst_search(bst_root, target)
        avl_res, avl_time = avl_search(avl_root, target)
        exp_res, exp_time = exponential_search(arr, target)
        
        return jsonify({
            'status': 'success',
            'results': {
                'linear_search': {
                    'index': linear_res,
                    'time_ms': linear_time * 1000,
                    'complexity': 'O(N)'
                },
                'binary_search': {
                    'index': binary_res,
                    'time_ms': binary_time * 1000,
                    'complexity': 'O(log N)'
                },
                'hash_search': {
                    'index': hash_res,
                    'time_ms': hash_time * 1000,
                    'complexity': 'O(1)'
                },
                'bst_search': {
                    'index': bst_res,
                    'time_ms': bst_time * 1000,
                    'complexity': 'O(h) / O(log N)'
                },
                'avl_search': {
                    'index': avl_res,
                    'time_ms': avl_time * 1000,
                    'complexity': 'O(log N)'
                },
                'exponential_search': {
                    'index': exp_res,
                    'time_ms': exp_time * 1000,
                    'complexity': 'O(log N)'
                }
            }
        })
    except ValueError as ve:
        return jsonify({'status': 'error', 'message': f"Validation Error: {str(ve)}"}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': f"Internal Error: {str(e)}"}), 500

@app.route('/api/subset', methods=['POST'])
def compare_subset():
    try:
        data = request.get_json()
        collection_a = validate_number_list(data.get('collection_a', ''))
        collection_b = validate_number_list(data.get('collection_b', ''))
        
        # Run algorithms
        list_res, list_time = is_subset_list(collection_a, collection_b)
        set_res, set_time = is_subset_set(collection_a, collection_b)
        
        return jsonify({
            'status': 'success',
            'results': {
                'subset_list': {
                    'is_subset': list_res,
                    'time_ms': list_time * 1000,
                    'complexity': 'O(N * M)'
                },
                'subset_set': {
                    'is_subset': set_res,
                    'time_ms': set_time * 1000,
                    'complexity': 'O(N + M)'
                }
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400


if __name__ == '__main__':
    app.run(debug=True)
