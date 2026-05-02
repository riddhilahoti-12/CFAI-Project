document.addEventListener('DOMContentLoaded', () => {
    
    // Big-O Complexity Chart Initialization
    const ctx = document.getElementById('complexityChart').getContext('2d');
    const elements = [10, 50, 100, 500, 1000];
    
    // Calculate theoretical points
    const oLogN = elements.map(n => Math.log2(n));
    const oN = elements.map(n => n);
    const oNLogN = elements.map(n => n * Math.log2(n));
    const oN2 = elements.map(n => Math.pow(n, 2));

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: elements.map(n => `n=${n}`),
            datasets: [
                {
                    label: 'O(log N) - Binary Search',
                    data: oLogN,
                    borderColor: '#10b981', // Emerald
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'O(N) - Linear Search',
                    data: oN,
                    borderColor: '#3b82f6', // Blue
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'O(N log N) - Merge Sort',
                    data: oNLogN,
                    borderColor: '#8b5cf6', // Purple
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'O(N^2) - Bubble Sort',
                    data: oN2,
                    borderColor: '#ef4444', // Red
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    type: 'logarithmic',
                    title: {
                        display: true,
                        text: 'Operations (Log Scale)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Elements (n)'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Theoretical Time Complexities'
                }
            }
        }
    });

    const searchForm = document.getElementById('search-form');
    const searchResults = document.getElementById('search-results');

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const arrayInput = document.getElementById('array-input').value;
        const targetInput = document.getElementById('target-input').value;
        
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
        searchResults.style.gridTemplateColumns = '1fr 1fr';
        searchResults.style.gap = '1rem';
        
        searchResults.innerHTML = `
            <div style="background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 8px;">
                <h3 style="color: var(--accent-blue);">Linear Search</h3>
                <p style="font-size: 1.5rem; margin: 0.5rem 0;">${results.linear_search.time_ms.toFixed(4)} ms</p>
                <p class="text-secondary">Complexity: ${results.linear_search.complexity}</p>
                <p class="text-secondary">Found at index: ${results.linear_search.index}</p>
            </div>
            <div style="background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 8px;">
                <h3 style="color: var(--accent-purple);">Binary Search</h3>
                <p style="font-size: 1.5rem; margin: 0.5rem 0;">${results.binary_search.time_ms.toFixed(4)} ms</p>
                <p class="text-secondary">Complexity: ${results.binary_search.complexity}</p>
                <p class="text-secondary">Found at index: ${results.binary_search.index}</p>
            </div>
        `;
    }

    // Sorting Logic
    const sortForm = document.getElementById('sort-form');
    const sortResults = document.getElementById('sort-results');

    sortForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const arrayInput = document.getElementById('sort-array-input').value;
        
        // Show loading state
        const submitBtn = sortForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'Calculating...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/sort', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ array: arrayInput })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                displaySortResults(data.results);
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

    function displaySortResults(results) {
        sortResults.style.display = 'grid';
        sortResults.style.gridTemplateColumns = '1fr 1fr';
        sortResults.style.gap = '1rem';
        
        sortResults.innerHTML = `
            <div style="background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 8px;">
                <h3 style="color: var(--accent-blue);">Bubble Sort</h3>
                <p style="font-size: 1.5rem; margin: 0.5rem 0;">${results.bubble_sort.time_ms.toFixed(4)} ms</p>
                <p class="text-secondary">Complexity: ${results.bubble_sort.complexity}</p>
            </div>
            <div style="background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 8px;">
                <h3 style="color: var(--accent-purple);">Merge Sort</h3>
                <p style="font-size: 1.5rem; margin: 0.5rem 0;">${results.merge_sort.time_ms.toFixed(4)} ms</p>
                <p class="text-secondary">Complexity: ${results.merge_sort.complexity}</p>
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
            <div style="background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 8px;">
                <h3 style="color: var(--accent-blue);">List Approach</h3>
                <p style="font-size: 1.5rem; margin: 0.5rem 0;">${results.subset_list.time_ms.toFixed(4)} ms</p>
                <p class="text-secondary">Complexity: ${results.subset_list.complexity}</p>
                <p class="text-secondary">Is Subset: ${results.subset_list.is_subset}</p>
            </div>
            <div style="background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 8px;">
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
    document.getElementById('sort-generate-btn').addEventListener('click', () => {
        const largeArray = Array.from({length: 2000}, () => Math.floor(Math.random() * 10000));
        document.getElementById('sort-array-input').value = largeArray.join(', ');
    });

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
