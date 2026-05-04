document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchResults = document.getElementById('search-results');

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const arrayInput = document.getElementById('array-input').value.trim();
        const targetInput = document.getElementById('target-input').value.trim();
        
        // Frontend Validation
        if (!arrayInput || !targetInput) {
            showError('Please fill in both the dataset and the target number.');
            return;
        }
        
        // Show loading state
        const submitBtn = searchForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'Calculating...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ array: arrayInput, target: targetInput })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                displaySearchResults(data.results);
            } else {
                showError('Error: ' + data.message);
            }
        } catch (error) {
            showError('Failed to connect to backend server.');
        } finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });

    function displaySearchResults(results) {
        searchResults.style.display = 'grid';
        searchResults.style.gridTemplateColumns = 'repeat(4, 1fr)';
        searchResults.style.gap = '1rem';
        
        searchResults.innerHTML = `
            <div class="result-card">
                <h3 style="color: var(--accent-blue);">Linear Search</h3>
                <p style="font-size: 1.5rem; margin: 0.5rem 0;">${results.linear_search.time_ms.toFixed(4)} ms</p>
                <p class="text-secondary">Complexity: ${results.linear_search.complexity}</p>
                <p class="text-secondary">Found at index: ${results.linear_search.index}</p>
            </div>
            <div class="result-card">
                <h3 style="color: var(--accent-purple);">Binary Search</h3>
                <p style="font-size: 1.5rem; margin: 0.5rem 0;">${results.binary_search.time_ms.toFixed(4)} ms</p>
                <p class="text-secondary">Complexity: ${results.binary_search.complexity}</p>
                <p class="text-secondary">Found at index: ${results.binary_search.index}</p>
            </div>
            <div class="result-card">
                <h3 style="color: #f59e0b;">Hash Search</h3>
                <p style="font-size: 1.5rem; margin: 0.5rem 0;">${results.hash_search.time_ms.toFixed(4)} ms</p>
                <p class="text-secondary">Complexity: ${results.hash_search.complexity}</p>
                <p class="text-secondary">Found at index: ${results.hash_search.index}</p>
            </div>
            <div class="result-card">
                <h3 style="color: #10b981;">BST Search</h3>
                <p style="font-size: 1.5rem; margin: 0.5rem 0;">${results.bst_search.time_ms.toFixed(4)} ms</p>
                <p class="text-secondary">Complexity: ${results.bst_search.complexity}</p>
                <p class="text-secondary">Found at index: ${results.bst_search.index}</p>
            </div>
        `;
    }



    // Subset Checking Logic
    const subsetForm = document.getElementById('subset-form');
    const subsetResults = document.getElementById('subset-results');

    subsetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const colAInput = document.getElementById('collection-a-input').value;
        const colBInput = document.getElementById('collection-b-input').value;
        
        // Show loading state
        const submitBtn = subsetForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'Calculating...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/subset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ collection_a: colAInput, collection_b: colBInput })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                displaySubsetResults(data.results);
            } else {
                showError('Error: ' + data.message);
            }
        } catch (error) {
            showError('Failed to connect to backend server.');
        } finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });

    function displaySubsetResults(results) {
        subsetResults.style.display = 'grid';
        subsetResults.style.gridTemplateColumns = '1fr 1fr';
        subsetResults.style.gap = '1rem';
        
        subsetResults.innerHTML = `
            <div class="result-card">
                <h3 style="color: var(--accent-blue);">List Approach</h3>
                <p style="font-size: 1.5rem; margin: 0.5rem 0;">${results.subset_list.time_ms.toFixed(4)} ms</p>
                <p class="text-secondary">Complexity: ${results.subset_list.complexity}</p>
                <p class="text-secondary">Is Subset: ${results.subset_list.is_subset}</p>
            </div>
            <div class="result-card">
                <h3 style="color: var(--accent-purple);">Set Approach</h3>
                <p style="font-size: 1.5rem; margin: 0.5rem 0;">${results.subset_set.time_ms.toFixed(4)} ms</p>
                <p class="text-secondary">Complexity: ${results.subset_set.complexity}</p>
                <p class="text-secondary">Is Subset: ${results.subset_set.is_subset}</p>
            </div>
        `;
    }

    // Error Handling UI
    function showError(message) {
        const toast = document.getElementById('error-toast');
        const msgSpan = document.getElementById('error-message');
        msgSpan.innerText = message;
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 5000);
    }

    // Dataset Generators


    document.getElementById('search-generate-btn').addEventListener('click', () => {
        const largeArray = Array.from({length: 10000}, () => Math.floor(Math.random() * 100000));
        largeArray.sort((a, b) => a - b); // Sorting for binary search
        document.getElementById('array-input').value = largeArray.join(', ');
        document.getElementById('target-input').value = largeArray[Math.floor(Math.random() * largeArray.length)];
    });

    document.getElementById('subset-generate-btn').addEventListener('click', () => {
        const largeArray = Array.from({length: 10000}, () => Math.floor(Math.random() * 50000));
        const smallArray = Array.from({length: 500}, () => largeArray[Math.floor(Math.random() * largeArray.length)]);
        document.getElementById('collection-b-input').value = largeArray.join(', ');
        document.getElementById('collection-a-input').value = smallArray.join(', ');
    });
});
