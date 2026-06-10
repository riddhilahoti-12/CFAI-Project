document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchResults = document.getElementById('search-results');
    const subsetForm = document.getElementById('subset-form');
    const subsetResults = document.getElementById('subset-results');

    let searchChart = null;
    let subsetChart = null;
    let currentSearchResults = null;

    // --- Search Comparator Event Handler ---
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const arrayInput = document.getElementById('array-input').value.trim();
        const targetInput = document.getElementById('target-input').value.trim();
        
        if (!arrayInput || !targetInput) {
            showError('Please fill in both the dataset and the target number.');
            return;
        }
        
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
                currentSearchResults = data.results;
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

    // --- Subset Comparator Event Handler ---
    subsetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const colAInput = document.getElementById('collection-a-input').value.trim();
        const colBInput = document.getElementById('collection-b-input').value.trim();
        
        if (!colAInput || !colBInput) {
            showError('Please fill in both collections.');
            return;
        }

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

    // --- Helpers ---
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

    function formatSubsetLabel(key) {
        return key
            .replace('subset_', '')
            .replace('list', 'List')
            .replace('set', 'Set')
            .replace('sorting', 'Sorting');
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

    function analyzeSubsetPerformance(results) {
        const keys = ['subset_list', 'subset_set'];
        const performance = keys.map((key) => ({
            key,
            name: formatSubsetLabel(key),
            time_ms: results[key].time_ms,
            complexity: results[key].complexity,
            is_subset: results[key].is_subset
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

    // --- Chart Generators (Modern Doughnut Style) ---
    function createSearchComparisonChart(results, analysis) {
        const ctx = document.getElementById('search-chart').getContext('2d');
        const labels = analysis.keys.map(formatAlgorithmLabel);
        const values = analysis.keys.map((key) => results[key].time_ms);
        
        // Color mapping corresponding to CSS design
        const backgroundColors = [
            'rgba(236, 72, 153, 0.85)', // Linear - Magenta
            'rgba(59, 130, 246, 0.85)',  // Binary - Blue
            'rgba(16, 185, 129, 0.85)',  // Hash - Cyber Green
            'rgba(168, 85, 247, 0.85)',  // BST - Purple
            'rgba(6, 182, 212, 0.85)',   // AVL - Cyan
            'rgba(249, 115, 22, 0.85)'   // BFS - Orange
        ];

        if (searchChart) {
            searchChart.destroy();
        }

        searchChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    label: 'Search Time (ms)',
                    data: values,
                    backgroundColor: backgroundColors,
                    borderColor: 'rgba(7, 11, 25, 0.8)',
                    borderWidth: 2,
                    hoverOffset: 12
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#94a3b8',
                            font: { family: 'Outfit', size: 10, weight: '500' },
                            padding: 10,
                            boxWidth: 12
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const val = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((val / total) * 100).toFixed(2) : 0;
                                return ` ${context.label}: ${val.toFixed(4)} ms (${percentage}%)`;
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Execution Time Share',
                        color: '#f8fafc',
                        font: { family: 'Outfit', size: 14, weight: '600' }
                    }
                },
                cutout: '65%'
            }
        });
    }

    function createSubsetComparisonChart(results, analysis) {
        const ctx = document.getElementById('subset-chart').getContext('2d');
        const labels = analysis.keys.map(formatSubsetLabel);
        const values = analysis.keys.map((key) => results[key].time_ms);
        
        const backgroundColors = [
            'rgba(239, 68, 68, 0.85)',   // List - Cyber Red
            'rgba(16, 185, 129, 0.85)'   // Set - Cyber Green
        ];

        if (subsetChart) {
            subsetChart.destroy();
        }

        subsetChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    label: 'Subset Check Time (ms)',
                    data: values,
                    backgroundColor: backgroundColors,
                    borderColor: 'rgba(7, 11, 25, 0.8)',
                    borderWidth: 2,
                    hoverOffset: 12
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#94a3b8',
                            font: { family: 'Outfit', size: 10, weight: '500' },
                            padding: 10,
                            boxWidth: 12
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const val = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((val / total) * 100).toFixed(2) : 0;
                                return ` ${context.label}: ${val.toFixed(4)} ms (${percentage}%)`;
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Execution Time Share',
                        color: '#f8fafc',
                        font: { family: 'Outfit', size: 14, weight: '600' }
                    }
                },
                cutout: '65%'
            }
        });
    }

    // --- Dynamic Filters Search Comparison logic ---
    function updateSearchComparison(results) {
        if (!results) return;
        const selectA = document.getElementById('algo-a-select');
        const selectB = document.getElementById('algo-b-select');
        const detailsContainer = document.getElementById('comparison-analysis-details');

        const keyA = selectA.value;
        const keyB = selectB.value;

        const dataA = results[keyA];
        const dataB = results[keyB];

        if (!dataA || !dataB) return;

        const labelA = formatAlgorithmLabel(keyA);
        const labelB = formatAlgorithmLabel(keyB);

        const timeA = dataA.time_ms;
        const timeB = dataB.time_ms;

        let badgeHTML = '';
        let summaryText = '';
        let barHTML = '';

        if (timeA === 0 && timeB === 0) {
            badgeHTML = `<span class="speedup-badge speedup-equal">Equal Speed</span>`;
            summaryText = `Both algorithms executed instantaneously. Please try a larger array dataset to get fine-grained metrics.`;
        } else if (timeA === timeB) {
            badgeHTML = `<span class="speedup-badge speedup-equal">Equal Speed</span>`;
            summaryText = `Both techniques completed execution in exactly <strong>${timeA.toFixed(4)} ms</strong>.`;
        } else {
            const isAFaster = timeA < timeB;
            const fasterLabel = isAFaster ? labelA : labelB;
            const slowerLabel = isAFaster ? labelB : labelA;
            const fasterTime = isAFaster ? timeA : timeB;
            const slowerTime = isAFaster ? timeB : timeA;

            const multiplier = fasterTime > 0 ? (slowerTime / fasterTime) : 0;
            const pctDiff = slowerTime > 0 ? (((slowerTime - fasterTime) / slowerTime) * 100) : 0;

            if (isAFaster) {
                badgeHTML = `
                    <span class="speedup-badge speedup-faster">${labelA} is faster</span>
                    <span class="text-secondary text-sm">by ${multiplier.toFixed(1)}x</span>
                `;
            } else {
                badgeHTML = `
                    <span class="speedup-badge speedup-slower">${labelB} is faster</span>
                    <span class="text-secondary text-sm">by ${multiplier.toFixed(1)}x</span>
                `;
            }

            summaryText = `
                <strong>${fasterLabel}</strong> executed in just <strong>${fasterTime.toFixed(4)} ms</strong>, which is 
                <strong>${pctDiff.toFixed(2)}%</strong> faster than <strong>${slowerLabel}</strong> taking <strong>${slowerTime.toFixed(4)} ms</strong>. 
                This renders a speedup ratio of <strong>${multiplier.toFixed(1)}x</strong>.
            `;

            // Draw relative speed proportion bar
            const total = timeA + timeB;
            const widthA = total > 0 ? (timeA / total) * 100 : 50;
            const widthB = total > 0 ? (timeB / total) * 100 : 50;

            barHTML = `
                <div style="margin-top: 1rem;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">
                        <span>${labelA}: ${widthA.toFixed(1)}% slice</span>
                        <span>${labelB}: ${widthB.toFixed(1)}% slice</span>
                    </div>
                    <div class="speed-bar-container">
                        <div class="speed-bar-fill speed-bar-a" style="width: ${widthA}%;"></div>
                        <div class="speed-bar-fill speed-bar-b" style="width: ${widthB}%;"></div>
                    </div>
                </div>
            `;
        }

        detailsContainer.innerHTML = `
            <div class="comp-stat-row">
                <span class="comp-stat-label">Performance Comparison</span>
                <span class="comp-stat-value">${badgeHTML}</span>
            </div>
            <div class="comp-stat-row">
                <span class="comp-stat-label">${labelA} Complexity</span>
                <span class="comp-stat-value" style="font-family: 'Fira Code', monospace; color: var(--accent-blue);">${dataA.complexity}</span>
            </div>
            <div class="comp-stat-row">
                <span class="comp-stat-label">${labelB} Complexity</span>
                <span class="comp-stat-value" style="font-family: 'Fira Code', monospace; color: var(--accent-purple);">${dataB.complexity}</span>
            </div>
            <div class="comp-stat-row">
                <span class="comp-stat-label">Execution Timings</span>
                <span class="comp-stat-value" style="font-family: 'Fira Code', monospace;">
                    ${timeA.toFixed(4)} ms vs ${timeB.toFixed(4)} ms
                </span>
            </div>
            ${barHTML}
            <p class="comp-summary-text">
                💡 ${summaryText}
            </p>
        `;
    }

    // Bind dropdown change listeners
    document.getElementById('algo-a-select').addEventListener('change', () => {
        if (currentSearchResults) updateSearchComparison(currentSearchResults);
    });
    document.getElementById('algo-b-select').addEventListener('change', () => {
        if (currentSearchResults) updateSearchComparison(currentSearchResults);
    });

    // --- View Generators ---
    function displaySearchResults(results) {
        const analysis = analyzeSearchPerformance(results);

        // Make section visible
        searchResults.style.display = 'flex';
        searchResults.style.flexDirection = 'column';
        searchResults.style.gap = '1.5rem';

        // Set recommendations
        const recContainer = document.getElementById('search-recommendation');
        recContainer.innerHTML = `
            <h3 style="color: var(--accent-cyan); margin-bottom: 0.5rem; font-size: 1.1rem; display: flex; align-items: center; gap: 0.4rem;">
                🏆 Best Algorithm Choice
            </h3>
            <p style="font-size: 1.05rem; margin-bottom: 0.3rem;">Best choice: <strong style="color: var(--accent-green);">${analysis.best.name}</strong> — completed search in <strong style="color: var(--accent-green);">${analysis.best.time_ms.toFixed(4)} ms</strong>.</p>
            <p style="font-size: 1.05rem; margin-bottom: 0.3rem;">Avoid in production: <strong style="color: var(--accent-red);">${analysis.worst.name}</strong> — worst timing at <strong style="color: var(--accent-red);">${analysis.worst.time_ms.toFixed(4)} ms</strong>.</p>
            <p class="text-secondary text-sm">Note: BST & AVL require initial tree building overhead. This comparator measures direct retrieval speed.</p>
        `;

        // Render card results grid
        const gridContainer = document.getElementById('search-grid');
        gridContainer.innerHTML = `
            <div class="result-card" style="border-left: 4px solid var(--accent-magenta);">
                <h3>Linear Search</h3>
                <p class="time-val" style="color: var(--accent-magenta);">${results.linear_search.time_ms.toFixed(4)} ms</p>
                <p class="card-detail">Complexity: ${results.linear_search.complexity}</p>
                <p class="card-detail">Found index: ${results.linear_search.index}</p>
            </div>
            <div class="result-card" style="border-left: 4px solid var(--accent-blue);">
                <h3>Binary Search</h3>
                <p class="time-val" style="color: var(--accent-blue);">${results.binary_search.time_ms.toFixed(4)} ms</p>
                <p class="card-detail">Complexity: ${results.binary_search.complexity}</p>
                <p class="card-detail">Found index: ${results.binary_search.index}</p>
            </div>
            <div class="result-card" style="border-left: 4px solid var(--accent-green);">
                <h3>Hash Search</h3>
                <p class="time-val" style="color: var(--accent-green);">${results.hash_search.time_ms.toFixed(4)} ms</p>
                <p class="card-detail">Complexity: ${results.hash_search.complexity}</p>
                <p class="card-detail">Found index: ${results.hash_search.index}</p>
            </div>
            <div class="result-card" style="border-left: 4px solid var(--accent-purple);">
                <h3>BST Search</h3>
                <p class="time-val" style="color: var(--accent-purple);">${results.bst_search.time_ms.toFixed(4)} ms</p>
                <p class="card-detail">Complexity: ${results.bst_search.complexity}</p>
                <p class="card-detail">Found index: ${results.bst_search.index}</p>
            </div>
            <div class="result-card" style="border-left: 4px solid var(--accent-cyan);">
                <h3>AVL Search</h3>
                <p class="time-val" style="color: var(--accent-cyan);">${results.avl_search.time_ms.toFixed(4)} ms</p>
                <p class="card-detail">Complexity: ${results.avl_search.complexity}</p>
                <p class="card-detail">Found index: ${results.avl_search.index}</p>
            </div>
            <div class="result-card" style="border-left: 4px solid var(--accent-orange);">
                <h3>BFS Search</h3>
                <p class="time-val" style="color: var(--accent-orange);">${results.bfs_search.time_ms.toFixed(4)} ms</p>
                <p class="card-detail">Complexity: ${results.bfs_search.complexity}</p>
                <p class="card-detail">Found index: ${results.bfs_search.index}</p>
            </div>
        `;

        // Render comparative details block
        updateSearchComparison(results);

        // Build Doughnut Chart
        createSearchComparisonChart(results, analysis);
    }

    function displaySubsetResults(results) {
        const analysis = analyzeSubsetPerformance(results);

        // Make section visible
        subsetResults.style.display = 'flex';
        subsetResults.style.flexDirection = 'column';
        subsetResults.style.gap = '1.5rem';

        // Set recommendations
        const recContainer = document.getElementById('subset-recommendation');
        recContainer.innerHTML = `
            <h3 style="color: var(--accent-magenta); margin-bottom: 0.5rem; font-size: 1.1rem; display: flex; align-items: center; gap: 0.4rem;">
                🏆 Best Subset Algorithm Choice
            </h3>
            <p style="font-size: 1.05rem; margin-bottom: 0.3rem;">Best choice: <strong style="color: var(--accent-green);">${analysis.best.name} Approach</strong> — completed in <strong style="color: var(--accent-green);">${analysis.best.time_ms.toFixed(4)} ms</strong>.</p>
            <p style="font-size: 1.05rem; margin-bottom: 0.3rem;">Avoid if scale is large: <strong style="color: var(--accent-red);">${analysis.worst.name} Approach</strong> — worst timing at <strong style="color: var(--accent-red);">${analysis.worst.time_ms.toFixed(4)} ms</strong>.</p>
            <p class="text-secondary text-sm">Note: Set uses O(1) hashing for lookups, making it highly optimal for supersets.</p>
        `;

        // Render cards grid
        const gridContainer = document.getElementById('subset-grid');
        gridContainer.innerHTML = `
            <div class="result-card" style="border-left: 4px solid var(--accent-red);">
                <h3>List Approach</h3>
                <p class="time-val" style="color: var(--accent-red);">${results.subset_list.time_ms.toFixed(4)} ms</p>
                <p class="card-detail">Complexity: ${results.subset_list.complexity}</p>
                <p class="card-detail">Is Subset: ${results.subset_list.is_subset}</p>
            </div>
            <div class="result-card" style="border-left: 4px solid var(--accent-green);">
                <h3>Set Approach</h3>
                <p class="time-val" style="color: var(--accent-green);">${results.subset_set.time_ms.toFixed(4)} ms</p>
                <p class="card-detail">Complexity: ${results.subset_set.complexity}</p>
                <p class="card-detail">Is Subset: ${results.subset_set.is_subset}</p>
            </div>
        `;

        // Build Doughnut Chart
        createSubsetComparisonChart(results, analysis);
    }

    // --- Error Toast UI ---
    function showError(message) {
        const toast = document.getElementById('error-toast');
        const msgSpan = document.getElementById('error-message');
        msgSpan.innerText = message;
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 5000);
    }

    // --- Dataset Generators ---
    document.getElementById('search-generate-btn').addEventListener('click', () => {
        // Generate an array of size 5000 (enough to get non-zero measurements but keep browser responsive)
        const largeArray = Array.from({length: 5000}, () => Math.floor(Math.random() * 100000));
        largeArray.sort((a, b) => a - b); // Sorted array format
        document.getElementById('array-input').value = largeArray.join(', ');
        document.getElementById('target-input').value = largeArray[Math.floor(Math.random() * largeArray.length)];
    });

    document.getElementById('subset-generate-btn').addEventListener('click', () => {
        const superset = Array.from({length: 2000}, () => Math.floor(Math.random() * 50000));
        // Subset contains mostly elements from superset to simulate subset conditions
        const subset = Array.from({length: 150}, () => superset[Math.floor(Math.random() * superset.length)]);
        // Add a few random elements
        for (let i = 0; i < 15; i++) {
            subset.push(Math.floor(Math.random() * 100000));
        }
        document.getElementById('collection-b-input').value = superset.join(', ');
        document.getElementById('collection-a-input').value = subset.join(', ');
    });
});
