from flask import Flask, render_template, request, jsonify
from algorithms import linear_search, binary_search, validate_number_list

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
        
        # Run algorithms
        linear_res, linear_time = linear_search(arr, target)
        binary_res, binary_time = binary_search(arr, target)
        
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
                }
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)
