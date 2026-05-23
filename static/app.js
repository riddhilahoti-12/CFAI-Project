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

    let searchChart = null;

    function formatAlgorithmLabel(key) {
        return key
            .replace('_search', '')
            .replace('bst', 'BST')
            .replace('avl', 'AVL')
            .replace('bfs', 'BFS')
            .replace('hash', 'Hash')
            .replace('linear', 'Linear')
            .replace('binary', 'Binary');
    }

    function analyzeSearchPerformance(results) {
        const keys = ['linear_search', 'binary_search', 'hash_search', 'bst_search', 'avl_search', 'bfs_search'];
        const performance = keys.map((key) => ({
            key,
            name: formatAlgorithmLabel(key),
            time_ms: results[key].time_ms,
            complexity: results[key].complexity,
            index: results[key].index
        }));

        performance.sort((a, b) => a.time_ms - b.time_ms);

        const best = performance[0];
        const worst = performance[performance.length - 1];

        return {
            keys,
            performance,
            best,
            worst
        };
    }

    function createSearchComparisonChart(results, analysis) {
        const ctx = document.getElementById('search-chart').getContext('2d');
        const labels = analysis.keys.map(formatAlgorithmLabel);
        const values = analysis.keys.map((key) => results[key].time_ms);
        const backgroundColors = analysis.keys.map((key) => {
            if (key === analysis.best.key) return 'rgba(16, 185, 129, 0.9)';
            if (key === analysis.worst.key) return 'rgba(239, 68, 68, 0.9)';
            return 'rgba(59, 130, 246, 0.6)';
        });
        const borderColors = analysis.keys.map((key) => {
            if (key === analysis.best.key) return 'rgba(16, 185, 129, 1)';
            if (key === analysis.worst.key) return 'rgba(239, 68, 68, 1)';
            return 'rgba(59, 130, 246, 0.9)';
        });

        if (searchChart) {
            searchChart.destroy();
        }

        searchChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Search Time (ms)',
                    data: values,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 2,
                    borderRadius: 8,
                    maxBarThickness: 48
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => value.toFixed(2)
                        },
                        title: {
                            display: true,
                            text: 'Milliseconds'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.parsed.y.toFixed(4)} ms`
                        }
                    },
                    title: {
                        display: true,
                        text: 'Search Performance Across 6 Algorithms',
                        font: { size: 18 }
                    }
                }
            }
        });
    }

    function displaySearchResults(results) {
        const analysis = analyzeSearchPerformance(results);

        searchResults.style.display = 'block';
        searchResults.innerHTML = `
            <div class="chart-card">
                <canvas id="search-chart" style="width: 100%; height: 320px;"></canvas>
            </div>
            <div class="recommendation-card">
                <h3 style="color: var(--accent-blue); margin-bottom: 0.75rem;">Recommended Search Technique</h3>
                <p style="font-size: 1.15rem; margin-bottom: 0.5rem;">Best choice: <strong>${analysis.best.name}</strong> — fastest time at <strong>${analysis.best.time_ms.toFixed(4)} ms</strong>.</p>
                <p style="font-size: 1.15rem; margin-bottom: 0.5rem;">Avoid if performance matters: <strong>${analysis.worst.name}</strong> — slowest time at <strong>${analysis.worst.time_ms.toFixed(4)} ms</strong>.</p>
                <p class="text-secondary">This chart highlights the fastest algorithm in green and the slowest in red for this input scenario.</p>
            </div>
            <div class="search-results-grid">
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
                <div class="result-card">
                    <h3 style="color: var(--accent-red);">AVL Search</h3>
                    <p style="font-size: 1.5rem; margin: 0.5rem 0;">${results.avl_search.time_ms.toFixed(4)} ms</p>
                    <p class="text-secondary">Complexity: ${results.avl_search.complexity}</p>
                    <p class="text-secondary">Found at index: ${results.avl_search.index}</p>
                </div>
                <div class="result-card">
                    <h3 style="color: var(--accent-blue);">BFS Search</h3>
                    <p style="font-size: 1.5rem; margin: 0.5rem 0;">${results.bfs_search.time_ms.toFixed(4)} ms</p>
                    <p class="text-secondary">Complexity: ${results.bfs_search.complexity}</p>
                    <p class="text-secondary">Found at index: ${results.bfs_search.index}</p>
                </div>
            </div>
        `;

        createSearchComparisonChart(results, analysis);
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
        subsetResults.style.gridTemplateColumns = 'repeat(3, 1fr)';
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
            <div class="result-card">
                <h3 style="color: var(--accent-red);">Sorting Approach</h3>
                <p style="font-size: 1.5rem; margin: 0.5rem 0;">${results.subset_sorting.time_ms.toFixed(4)} ms</p>
                <p class="text-secondary">Complexity: ${results.subset_sorting.complexity}</p>
                <p class="text-secondary">Is Subset: ${results.subset_sorting.is_subset}</p>
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
