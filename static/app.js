document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const searchForm = document.getElementById('search-form');
    const searchResults = document.getElementById('search-results');
    const subsetForm = document.getElementById('subset-form');
    const subsetResults = document.getElementById('subset-results');

    // Drawer Toggles
    const searchConfigToggleBtn = document.getElementById('search-config-toggle-btn');
    const searchGeneratorConfig = document.getElementById('search-generator-config');
    const subsetConfigToggleBtn = document.getElementById('subset-config-toggle-btn');
    const subsetGeneratorConfig = document.getElementById('subset-generator-config');

    let searchChart = null;
    let subsetChart = null;
    let currentSearchResults = null;
    let currentSubsetResults = null;

    // --- Toggle Generator Configurations Drawer ---
    searchConfigToggleBtn.addEventListener('click', () => {
        const isHidden = searchGeneratorConfig.style.display === 'none';
        searchGeneratorConfig.style.display = isHidden ? 'block' : 'none';
        searchConfigToggleBtn.classList.toggle('active', isHidden);
    });

    subsetConfigToggleBtn.addEventListener('click', () => {
        const isHidden = subsetGeneratorConfig.style.display === 'none';
        subsetGeneratorConfig.style.display = isHidden ? 'block' : 'none';
        subsetConfigToggleBtn.classList.toggle('active', isHidden);
    });

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
                
                // Initialize/Sync visual simulation state with this input
                const parsedArray = parseNumbers(arrayInput).sort((a, b) => a - b);
                const targetVal = parseInt(targetInput);
                setupSearchSimulationData(parsedArray, targetVal);
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
                currentSubsetResults = data.results;
                displaySubsetResults(data.results);
                
                // Setup visual simulation with subset input
                const arrA = parseNumbers(colAInput);
                const arrB = parseNumbers(colBInput);
                setupSubsetSimulationData(arrA, arrB);
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

    // --- Utilities ---
    function parseNumbers(input) {
        return input.replace(/,/g, ' ').split(/\s+/).filter(x => x.length > 0).map(x => parseInt(x)).filter(x => !isNaN(x));
    }

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

        // Sort by time_ms ascending to find fastest in general
        performance.sort((a, b) => a.time_ms - b.time_ms);

        // Find best algorithm that successfully found the target (index !== -1)
        const successful = performance.filter(p => p.index !== -1);
        const best = successful.length > 0 ? successful[0] : performance[0];
        const worst = performance[performance.length - 1];

        return {
            keys,
            performance,
            best,
            worst
        };
    }

    function analyzeSubsetPerformance(results) {
        const keys = ['subset_list', 'subset_sorting', 'subset_set'];
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
            'rgba(168, 85, 247, 0.85)',  // Sorting - Purple
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



    // --- View Generators ---
    function displaySearchResults(results) {
        const analysis = analyzeSearchPerformance(results);

        searchResults.style.display = 'flex';
        searchResults.style.flexDirection = 'column';
        searchResults.style.gap = '1.5rem';

        const recContainer = document.getElementById('search-recommendation');
        recContainer.innerHTML = `
            <h3 style="color: var(--accent-cyan); margin-bottom: 0.5rem; font-size: 1.1rem; display: flex; align-items: center; gap: 0.4rem;">
                🏆 Best Algorithm Choice
            </h3>
            <p style="font-size: 1.05rem; margin-bottom: 0.3rem;">Best choice: <strong style="color: var(--accent-green);">${analysis.best.name}</strong> — completed search in <strong style="color: var(--accent-green);">${analysis.best.time_ms.toFixed(4)} ms</strong>.</p>
            <p style="font-size: 1.05rem; margin-bottom: 0.3rem;">Avoid in production: <strong style="color: var(--accent-red);">${analysis.worst.name}</strong> — worst timing at <strong style="color: var(--accent-red);">${analysis.worst.time_ms.toFixed(4)} ms</strong>.</p>
            <p class="text-secondary text-sm">Note: BST & AVL require initial tree building overhead. This comparator measures direct retrieval speed.</p>
        `;

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

        createSearchComparisonChart(results, analysis);
    }

    function displaySubsetResults(results) {
        const analysis = analyzeSubsetPerformance(results);

        subsetResults.style.display = 'flex';
        subsetResults.style.flexDirection = 'column';
        subsetResults.style.gap = '1.5rem';

        const recContainer = document.getElementById('subset-recommendation');
        recContainer.innerHTML = `
            <h3 style="color: var(--accent-magenta); margin-bottom: 0.5rem; font-size: 1.1rem; display: flex; align-items: center; gap: 0.4rem;">
                🏆 Best Subset Algorithm Choice
            </h3>
            <p style="font-size: 1.05rem; margin-bottom: 0.3rem;">Best choice: <strong style="color: var(--accent-green);">${analysis.best.name} Approach</strong> — completed in <strong style="color: var(--accent-green);">${analysis.best.time_ms.toFixed(4)} ms</strong>.</p>
            <p style="font-size: 1.05rem; margin-bottom: 0.3rem;">Avoid if scale is large: <strong style="color: var(--accent-red);">${analysis.worst.name} Approach</strong> — worst timing at <strong style="color: var(--accent-red);">${analysis.worst.time_ms.toFixed(4)} ms</strong>.</p>
            <p class="text-secondary text-sm">Note: Set uses O(1) hash maps for lookup, whereas Sorting processes via sorted pointers, and List uses sequential scans.</p>
        `;

        const gridContainer = document.getElementById('subset-grid');
        gridContainer.innerHTML = `
            <div class="result-card" style="border-left: 4px solid var(--accent-red);">
                <h3>List Approach</h3>
                <p class="time-val" style="color: var(--accent-red);">${results.subset_list.time_ms.toFixed(4)} ms</p>
                <p class="card-detail">Complexity: ${results.subset_list.complexity}</p>
                <p class="card-detail">Is Subset: ${results.subset_list.is_subset}</p>
            </div>
            <div class="result-card" style="border-left: 4px solid var(--accent-purple);">
                <h3>Sorting Approach</h3>
                <p class="time-val" style="color: var(--accent-purple);">${results.subset_sorting.time_ms.toFixed(4)} ms</p>
                <p class="card-detail">Complexity: ${results.subset_sorting.complexity}</p>
                <p class="card-detail">Is Subset: ${results.subset_sorting.is_subset}</p>
            </div>
            <div class="result-card" style="border-left: 4px solid var(--accent-green);">
                <h3>Set Approach</h3>
                <p class="time-val" style="color: var(--accent-green);">${results.subset_set.time_ms.toFixed(4)} ms</p>
                <p class="card-detail">Complexity: ${results.subset_set.complexity}</p>
                <p class="card-detail">Is Subset: ${results.subset_set.is_subset}</p>
            </div>
        `;

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

    // --- Dataset Generators Logic ---
    document.getElementById('search-generate-btn').addEventListener('click', () => {
        const size = parseInt(document.getElementById('search-gen-size').value);
        const pattern = document.getElementById('search-gen-pattern').value;
        const targetPlacement = document.getElementById('search-gen-target').value;

        // Generate base array
        let arr = [];
        if (pattern === 'duplicates') {
            const uniquePool = Array.from({length: Math.max(5, Math.floor(size / 20))}, () => Math.floor(Math.random() * 50000));
            arr = Array.from({length: size}, () => uniquePool[Math.floor(Math.random() * uniquePool.length)]);
        } else {
            arr = Array.from({length: size}, () => Math.floor(Math.random() * 100000));
        }

        // Apply ordering patterns
        if (pattern === 'sorted') {
            arr.sort((a, b) => a - b);
        } else if (pattern === 'reverse') {
            arr.sort((a, b) => b - a);
        } else if (pattern === 'nearly_sorted') {
            arr.sort((a, b) => a - b);
            const swaps = Math.max(1, Math.floor(size * 0.03));
            for (let i = 0; i < swaps; i++) {
                const idx = Math.floor(Math.random() * (size - 1));
                const temp = arr[idx];
                arr[idx] = arr[idx + 1];
                arr[idx + 1] = temp;
            }
        } else {
            arr.sort((a, b) => a - b);
        }

        // Handle target placement
        let target = 0;
        if (targetPlacement === 'start') {
            target = arr[0];
        } else if (targetPlacement === 'end') {
            target = arr[arr.length - 1];
        } else if (targetPlacement === 'absent') {
            target = 999999;
        } else {
            target = arr[Math.floor(Math.random() * arr.length)];
        }

        document.getElementById('array-input').value = arr.join(', ');
        document.getElementById('target-input').value = target;
        
        setupSearchSimulationData(arr, target);
    });

    document.getElementById('subset-generate-btn').addEventListener('click', () => {
        const sizeA = parseInt(document.getElementById('subset-gen-size-a').value);
        const sizeB = parseInt(document.getElementById('subset-gen-size-b').value);
        const overlap = parseInt(document.getElementById('subset-gen-overlap').value);

        const superset = Array.from({length: sizeB}, () => Math.floor(Math.random() * 80000));
        let subset = [];

        if (overlap === 100) {
            subset = Array.from({length: sizeA}, () => superset[Math.floor(Math.random() * superset.length)]);
        } else if (overlap === 50) {
            const countFromB = Math.floor(sizeA / 2);
            const fromB = Array.from({length: countFromB}, () => superset[Math.floor(Math.random() * superset.length)]);
            const extra = Array.from({length: sizeA - countFromB}, () => Math.floor(Math.random() * 80000) + 90000);
            subset = [...fromB, ...extra];
        } else {
            subset = Array.from({length: sizeA}, () => Math.floor(Math.random() * 80000) + 90000);
        }

        document.getElementById('collection-b-input').value = superset.join(', ');
        document.getElementById('collection-a-input').value = subset.join(', ');

        setupSubsetSimulationData(subset, superset);
    });

    // =========================================================================
    // ================= DUAL SIMULATION ENGINES ===============================
    // =========================================================================

    // --- SEARCH SIMULATION STATE ---
    let searchSimInterval = null;
    let searchSimState = {
        isPlaying: false,
        speed: 500,
        dataset: [],
        target: null,
        leftAlgo: 'linear_search',
        rightAlgo: 'binary_search',
        leftEngine: null,
        rightEngine: null
    };

    function setupSearchSimulationData(parsedArray, targetVal) {
        let sample = [];
        const pattern = document.getElementById('search-gen-pattern') ? document.getElementById('search-gen-pattern').value : 'random';
        const placement = document.getElementById('search-gen-target') ? document.getElementById('search-gen-target').value : 'random';
        
        const baseVals = [12, 24, 35, 42, 57, 68, 71, 80, 89, 95, 102, 114, 128, 137, 149];
        
        if (placement === 'absent') {
            sample = [...baseVals];
            searchSimState.target = 88;
        } else if (placement === 'start') {
            sample = [...baseVals];
            sample[0] = targetVal;
            searchSimState.target = targetVal;
        } else if (placement === 'end') {
            sample = [...baseVals];
            sample[14] = targetVal;
            searchSimState.target = targetVal;
        } else {
            sample = [...baseVals];
            sample[7] = targetVal;
            searchSimState.target = targetVal;
        }

        // Always sort ascending for simulation view because Binary/BST/AVL search require ascending sorted inputs
        // and the backend comparison sorts it ascending as well.
        sample.sort((a, b) => a - b);

        searchSimState.dataset = sample;
        resetSearchSimulation();
    }

    function resetSearchSimulation() {
        stopSearchSimulationTimer();
        
        searchSimState.isPlaying = false;
        document.getElementById('sim-search-play-btn').innerText = '▶ Play';
        document.getElementById('sim-search-play-btn').disabled = false;
        document.getElementById('sim-search-pause-btn').disabled = true;
        document.getElementById('sim-search-step-btn').disabled = false;

        searchSimState.leftAlgo = document.getElementById('sim-search-left-select').value;
        searchSimState.rightAlgo = document.getElementById('sim-search-right-select').value;

        searchSimState.leftEngine = createSearchEngineState(searchSimState.leftAlgo, searchSimState.dataset, searchSimState.target);
        searchSimState.rightEngine = createSearchEngineState(searchSimState.rightAlgo, searchSimState.dataset, searchSimState.target);

        renderSearchPanel('left', searchSimState.leftEngine);
        renderSearchPanel('right', searchSimState.rightEngine);
    }

    function createSearchEngineState(algo, dataset, target) {
        const length = dataset.length;
        const state = {
            algo,
            dataset,
            target,
            status: 'searching',
            steps: 0,
            comps: 0,
            comparingIndex: -1,
            visited: new Set(),
            msg: 'Initializing...',
            idx: 0,
            left: 0,
            right: length - 1,
            mid: -1,
            currNode: Math.floor((length - 1) / 2),
            bfsQueue: [Math.floor((length - 1) / 2)],
            bfsTree: {
                7: [3, 11], 
                3: [1, 5], 11: [9, 13], 
                1: [0, 2], 5: [4, 6], 9: [8, 10], 13: [12, 14]
            }
        };

        if (algo === 'binary_search') {
            state.mid = Math.floor((state.left + state.right) / 2);
            state.msg = `Bounds: [${state.left}..${state.right}]. Pivot index: ${state.mid}`;
        } else if (algo === 'linear_search') {
            state.msg = `Scanning index 0`;
        } else if (algo === 'hash_search') {
            state.msg = `Checking direct slot`;
        } else if (algo === 'bst_search' || algo === 'avl_search') {
            state.msg = `Start at tree root: index ${state.currNode}`;
        } else if (algo === 'bfs_search') {
            state.msg = `Start BFS queue: [${state.bfsQueue.join(', ')}]`;
        }

        return state;
    }

    function renderSearchPanel(panelSide, engine) {
        const titleEl = document.getElementById(`sim-search-${panelSide}-title`);
        const stepsEl = document.getElementById(`sim-search-${panelSide}-steps`);
        const compsEl = document.getElementById(`sim-search-${panelSide}-comps`);
        const msgEl = document.getElementById(`sim-search-${panelSide}-msg`);
        const vizContainer = document.getElementById(`sim-search-${panelSide}-viz`);

        titleEl.innerHTML = `${formatAlgorithmLabel(engine.algo)} <span style="font-size: 0.75rem; color: var(--accent-cyan); font-family: monospace;">(${getSearchComplexity(engine.algo)})</span>`;
        stepsEl.innerText = engine.steps;
        compsEl.innerText = engine.comps;
        msgEl.innerHTML = engine.msg;

        vizContainer.innerHTML = '';
        engine.dataset.forEach((val, idx) => {
            const block = document.createElement('div');
            block.className = 'sim-block';
            block.innerHTML = `<span>${val}</span><span class="sim-block-idx">${idx}</span>`;

            if (engine.status === 'found' && idx === engine.foundIndex) {
                block.classList.add('found');
            } else if (engine.status === 'searching' && idx === engine.comparingIndex) {
                block.classList.add('comparing');
            } else if (engine.visited.has(idx)) {
                block.classList.add('checked');
            } else if (engine.algo === 'binary_search' && idx >= engine.left && idx <= engine.right && engine.status === 'searching') {
                block.classList.add('active');
            } else if ((engine.algo === 'bst_search' || engine.algo === 'avl_search' || engine.algo === 'bfs_search') && idx === engine.currNode && engine.status === 'searching') {
                block.classList.add('active');
            }

            vizContainer.appendChild(block);
        });
    }

    function getSearchComplexity(algo) {
        if (algo === 'linear_search') return 'O(N)';
        if (algo === 'binary_search') return 'O(log N)';
        if (algo === 'hash_search') return 'O(1)';
        if (algo === 'bst_search') return 'O(h)';
        if (algo === 'avl_search') return 'O(log N)';
        if (algo === 'bfs_search') return 'O(N)';
        return '';
    }

    function stepSearchEngine(engine) {
        if (engine.status !== 'searching') return;

        engine.steps++;

        if (engine.algo === 'linear_search') {
            engine.comps++;
            engine.comparingIndex = engine.idx;
            const currentVal = engine.dataset[engine.idx];
            
            if (currentVal === engine.target) {
                engine.status = 'found';
                engine.foundIndex = engine.idx;
                engine.msg = `🎯 Found target ${engine.target} at index ${engine.idx}!`;
            } else {
                engine.visited.add(engine.idx);
                engine.idx++;
                if (engine.idx >= engine.dataset.length) {
                    engine.status = 'absent';
                    engine.msg = `❌ Target ${engine.target} not found in array.`;
                } else {
                    engine.msg = `Scan index ${engine.idx}: ${engine.dataset[engine.idx]} vs ${engine.target}`;
                }
            }
        } 
        
        else if (engine.algo === 'binary_search') {
            engine.comps++;
            engine.comparingIndex = engine.mid;
            const midVal = engine.dataset[engine.mid];

            if (midVal === engine.target) {
                engine.status = 'found';
                engine.foundIndex = engine.mid;
                engine.msg = `🎯 Found target ${engine.target} at index ${engine.mid}!`;
            } else if (midVal < engine.target) {
                for (let i = engine.left; i <= engine.mid; i++) engine.visited.add(i);
                engine.left = engine.mid + 1;
                engine.mid = Math.floor((engine.left + engine.right) / 2);
                if (engine.left > engine.right) {
                    engine.status = 'absent';
                    engine.msg = `❌ Target ${engine.target} not found in array bounds.`;
                } else {
                    engine.msg = `Target ${engine.target} > Pivot ${midVal}. Look right [index ${engine.left}..${engine.right}]. Mid is ${engine.mid}.`;
                }
            } else {
                for (let i = engine.mid; i <= engine.right; i++) engine.visited.add(i);
                engine.right = engine.mid - 1;
                engine.mid = Math.floor((engine.left + engine.right) / 2);
                if (engine.left > engine.right) {
                    engine.status = 'absent';
                    engine.msg = `❌ Target ${engine.target} not found in array bounds.`;
                } else {
                    engine.msg = `Target ${engine.target} < Pivot ${midVal}. Look left [index ${engine.left}..${engine.right}]. Mid is ${engine.mid}.`;
                }
            }
        } 
        
        else if (engine.algo === 'hash_search') {
            engine.comps++;
            const idx = engine.dataset.indexOf(engine.target);
            if (idx !== -1) {
                engine.comparingIndex = idx;
                engine.status = 'found';
                engine.foundIndex = idx;
                engine.msg = `🎯 O(1) Instant Hashing maps target ${engine.target} directly to index ${idx}!`;
            } else {
                engine.status = 'absent';
                engine.msg = `❌ Target ${engine.target} absent in O(1) direct lookup map.`;
            }
        } 
        
        else if (engine.algo === 'bst_search' || engine.algo === 'avl_search') {
            engine.comps++;
            engine.comparingIndex = engine.currNode;
            const nodeVal = engine.dataset[engine.currNode];

            if (nodeVal === engine.target) {
                engine.status = 'found';
                engine.foundIndex = engine.currNode;
                engine.msg = `🎯 Found target ${engine.target} at BST node index ${engine.currNode}!`;
            } else if (engine.target < nodeVal) {
                engine.visited.add(engine.currNode);
                engine.right = engine.currNode - 1;
                engine.currNode = Math.floor((engine.left + engine.right) / 2);
                if (engine.left > engine.right || engine.currNode < 0 || engine.currNode >= engine.dataset.length) {
                    engine.status = 'absent';
                    engine.msg = `❌ Reached leaf. Target ${engine.target} not found.`;
                } else {
                    engine.msg = `Target ${engine.target} < Node ${nodeVal}. Traversed Left branch to node ${engine.currNode}.`;
                }
            } else {
                engine.visited.add(engine.currNode);
                engine.left = engine.currNode + 1;
                engine.currNode = Math.floor((engine.left + engine.right) / 2);
                if (engine.left > engine.right || engine.currNode < 0 || engine.currNode >= engine.dataset.length) {
                    engine.status = 'absent';
                    engine.msg = `❌ Reached leaf. Target ${engine.target} not found.`;
                } else {
                    engine.msg = `Target ${engine.target} > Node ${nodeVal}. Traversed Right branch to node ${engine.currNode}.`;
                }
            }
        } 
        
        else if (engine.algo === 'bfs_search') {
            if (engine.bfsQueue.length === 0) {
                engine.status = 'absent';
                engine.msg = `❌ Level order scan complete. Target ${engine.target} not found.`;
                return;
            }

            engine.comps++;
            const nodeIdx = engine.bfsQueue.shift();
            engine.comparingIndex = nodeIdx;
            engine.currNode = nodeIdx;
            const nodeVal = engine.dataset[nodeIdx];

            if (nodeVal === engine.target) {
                engine.status = 'found';
                engine.foundIndex = nodeIdx;
                engine.msg = `🎯 BFS found target ${engine.target} at Level-Order node index ${nodeIdx}!`;
            } else {
                engine.visited.add(nodeIdx);
                const children = engine.bfsTree[nodeIdx] || [];
                children.forEach(child => {
                    if (child >= 0 && child < engine.dataset.length) {
                        engine.bfsQueue.push(child);
                    }
                });
                engine.msg = `BFS visited ${nodeVal}. Next Queue: [${engine.bfsQueue.map(i => engine.dataset[i]).join(', ')}]`;
                if (engine.bfsQueue.length === 0) {
                    engine.status = 'absent';
                }
            }
        }
    }

    function stepSearchSimulation() {
        stepSearchEngine(searchSimState.leftEngine);
        stepSearchEngine(searchSimState.rightEngine);

        renderSearchPanel('left', searchSimState.leftEngine);
        renderSearchPanel('right', searchSimState.rightEngine);

        if (searchSimState.leftEngine.status !== 'searching' && searchSimState.rightEngine.status !== 'searching') {
            stopSearchSimulationTimer();
            searchSimState.isPlaying = false;
            document.getElementById('sim-search-play-btn').innerText = '▶ Play';
            document.getElementById('sim-search-pause-btn').disabled = true;
            document.getElementById('sim-search-play-btn').disabled = true;
            document.getElementById('sim-search-step-btn').disabled = true;
        }
    }

    function startSearchSimulationTimer() {
        stopSearchSimulationTimer();
        searchSimInterval = setInterval(stepSearchSimulation, searchSimState.speed);
    }

    function stopSearchSimulationTimer() {
        if (searchSimInterval) {
            clearInterval(searchSimInterval);
            searchSimInterval = null;
        }
    }

    // --- Bind Search Simulation controls ---
    document.getElementById('sim-search-play-btn').addEventListener('click', () => {
        if (searchSimState.isPlaying) return;
        searchSimState.isPlaying = true;
        document.getElementById('sim-search-play-btn').innerText = 'Running...';
        document.getElementById('sim-search-play-btn').disabled = true;
        document.getElementById('sim-search-pause-btn').disabled = false;
        document.getElementById('sim-search-step-btn').disabled = true;
        startSearchSimulationTimer();
    });

    document.getElementById('sim-search-pause-btn').addEventListener('click', () => {
        searchSimState.isPlaying = false;
        document.getElementById('sim-search-play-btn').innerText = '▶ Play';
        document.getElementById('sim-search-play-btn').disabled = false;
        document.getElementById('sim-search-pause-btn').disabled = true;
        document.getElementById('sim-search-step-btn').disabled = false;
        stopSearchSimulationTimer();
    });

    document.getElementById('sim-search-step-btn').addEventListener('click', () => {
        stepSearchSimulation();
    });

    document.getElementById('sim-search-reset-btn').addEventListener('click', () => {
        resetSearchSimulation();
    });

    document.getElementById('sim-search-speed').addEventListener('input', (e) => {
        const val = e.target.value;
        document.getElementById('sim-search-speed-val').innerText = val;
        searchSimState.speed = parseInt(val);
        if (searchSimState.isPlaying) {
            startSearchSimulationTimer();
        }
    });

    document.getElementById('sim-search-left-select').addEventListener('change', resetSearchSimulation);
    document.getElementById('sim-search-right-select').addEventListener('change', resetSearchSimulation);

    // =========================================================================
    // ============ SUBSET SIMULATION STATE & LOGIC ============================
    // =========================================================================
    let subsetSimInterval = null;
    let subsetSimState = {
        isPlaying: false,
        speed: 500,
        collA: [],
        collB: [],
        leftAlgo: 'subset_list',
        rightAlgo: 'subset_set',
        leftEngine: null,
        rightEngine: null
    };

    function setupSubsetSimulationData(arrA, arrB) {
        const overlap = document.getElementById('subset-gen-overlap') ? document.getElementById('subset-gen-overlap').value : '100';
        
        let sampleB = [12, 19, 27, 34, 45, 52, 60, 78, 83, 91];
        let sampleA = [];

        if (overlap === '100') {
            sampleA = [19, 45, 60, 78, 91];
        } else if (overlap === '50') {
            sampleA = [19, 45, 60, 100, 115];
        } else {
            sampleA = [100, 105, 110, 115, 120];
        }

        subsetSimState.collA = sampleA;
        subsetSimState.collB = sampleB;
        resetSubsetSimulation();
    }

    function resetSubsetSimulation() {
        stopSubsetSimulationTimer();

        subsetSimState.isPlaying = false;
        document.getElementById('sim-subset-play-btn').innerText = '▶ Play';
        document.getElementById('sim-subset-play-btn').disabled = false;
        document.getElementById('sim-subset-pause-btn').disabled = true;
        document.getElementById('sim-subset-step-btn').disabled = false;

        subsetSimState.leftAlgo = document.getElementById('sim-subset-left-select').value;
        subsetSimState.rightAlgo = document.getElementById('sim-subset-right-select').value;

        subsetSimState.leftEngine = createSubsetEngineState(subsetSimState.leftAlgo, subsetSimState.collA, subsetSimState.collB);
        subsetSimState.rightEngine = createSubsetEngineState(subsetSimState.rightAlgo, subsetSimState.collA, subsetSimState.collB);

        renderSubsetPanel('left', subsetSimState.leftEngine);
        renderSubsetPanel('right', subsetSimState.rightEngine);
    }

    function createSubsetEngineState(algo, collA, collB) {
        const state = {
            algo,
            collA: [...collA],
            collB: [...collB],
            status: 'searching',
            steps: 0,
            comps: 0,
            activeAIdx: -1,
            activeBIdx: -1,
            matches: {},
            msg: 'Ready to check.',
            idxA: 0,
            idxB: 0,
            setPhase: 'build',
            buildIdx: 0,
            checkIdx: 0,
            setStorage: new Set(),
            sortPhase: 'sorting_a',
            sortedA: [],
            sortedB: []
        };

        if (algo === 'subset_list') {
            state.msg = `Starting outer list loop. Pointer i = 0`;
        } else if (algo === 'subset_set') {
            state.msg = `Phase 1: Populate Set with Collection B values.`;
        } else if (algo === 'subset_sorting') {
            state.msg = `Phase 1: Sort Collection A.`;
        }

        return state;
    }

    function renderSubsetPanel(panelSide, engine) {
        const titleEl = document.getElementById(`sim-subset-${panelSide}-title`);
        const stepsEl = document.getElementById(`sim-subset-${panelSide}-steps`);
        const compsEl = document.getElementById(`sim-subset-${panelSide}-comps`);
        const msgEl = document.getElementById(`sim-subset-${panelSide}-msg`);
        const vizContainer = document.getElementById(`sim-subset-${panelSide}-viz`);

        titleEl.innerHTML = `${formatSubsetLabel(engine.algo)} Approach <span style="font-size: 0.75rem; color: var(--accent-magenta); font-family: monospace;">(${getSubsetComplexity(engine.algo)})</span>`;
        stepsEl.innerText = engine.steps;
        compsEl.innerText = engine.comps;
        msgEl.innerHTML = engine.msg;

        vizContainer.innerHTML = '';

        const rowA = document.createElement('div');
        rowA.className = 'sim-list-row';
        
        let labelTextA = 'Collection A (Subset)';
        if (engine.algo === 'subset_sorting' && engine.sortPhase !== 'sorting_a') {
            labelTextA = 'Collection A (Sorted)';
        }
        rowA.innerHTML = `<span class="sim-list-title">${labelTextA}</span>`;
        
        const elemsA = document.createElement('div');
        elemsA.className = 'sim-list-elements';
        
        const arrayToDrawA = (engine.algo === 'subset_sorting' && engine.sortPhase !== 'sorting_a') ? engine.sortedA : engine.collA;
        arrayToDrawA.forEach((val, idx) => {
            const item = document.createElement('span');
            item.className = 'sim-item';
            item.innerText = val;

            if (engine.status === 'subset') {
                item.classList.add('matched');
            } else if (engine.status === 'not_subset' && engine.matches[idx] === false) {
                item.classList.add('failed');
            } else if (engine.matches[idx] === true) {
                item.classList.add('matched');
            } else if (engine.matches[idx] === false) {
                item.classList.add('failed');
            } else if (engine.status === 'searching') {
                if (engine.algo === 'subset_list' && idx === engine.idxA) {
                    item.classList.add('active');
                } else if (engine.algo === 'subset_set' && engine.setPhase === 'check' && idx === engine.checkIdx) {
                    item.classList.add('active');
                } else if (engine.algo === 'subset_sorting' && engine.sortPhase === 'pointers' && idx === engine.idxA) {
                    item.classList.add('active');
                }
            }
            elemsA.appendChild(item);
        });
        rowA.appendChild(elemsA);

        const rowB = document.createElement('div');
        rowB.className = 'sim-list-row';
        
        let labelTextB = 'Collection B (Superset)';
        if (engine.algo === 'subset_sorting' && engine.sortPhase === 'pointers') {
            labelTextB = 'Collection B (Sorted)';
        }
        rowB.innerHTML = `<span class="sim-list-title">${labelTextB}</span>`;
        
        const elemsB = document.createElement('div');
        elemsB.className = 'sim-list-elements';
        
        const arrayToDrawB = (engine.algo === 'subset_sorting' && engine.sortPhase === 'pointers') ? engine.sortedB : engine.collB;
        arrayToDrawB.forEach((val, idx) => {
            const item = document.createElement('span');
            item.className = 'sim-item';
            item.innerText = val;

            if (engine.algo === 'subset_list' && engine.status === 'searching' && idx === engine.idxB && engine.idxA < engine.collA.length) {
                item.classList.add('comparing');
            } else if (engine.algo === 'subset_set') {
                if (engine.setPhase === 'build' && idx === engine.buildIdx) {
                    item.classList.add('comparing');
                } else if (engine.setStorage.has(val)) {
                    item.classList.add('highlight-set');
                }
            } else if (engine.algo === 'subset_sorting') {
                if (engine.sortPhase === 'pointers' && idx === engine.idxB) {
                    item.classList.add('comparing');
                }
            }

            elemsB.appendChild(item);
        });
        rowB.appendChild(elemsB);

        vizContainer.appendChild(rowA);
        vizContainer.appendChild(rowB);

        if (engine.algo === 'subset_set') {
            const setBox = document.createElement('div');
            setBox.className = 'sim-list-row';
            setBox.style.marginTop = '0.4rem';
            setBox.innerHTML = `
                <span class="sim-list-title" style="color: var(--accent-cyan);">Simulated Hash Set Storage:</span>
                <div class="sim-list-elements" style="background: rgba(0,0,0,0.2); padding: 0.4rem; border-radius: 8px; min-height: 30px;">
                    ${Array.from(engine.setStorage).map(v => `<span class="sim-item highlight-set" style="font-size: 0.7rem;">${v}</span>`).join('')}
                    ${engine.setStorage.size === 0 ? '<span class="text-secondary text-sm" style="font-style: italic;">Set empty</span>' : ''}
                </div>
            `;
            vizContainer.appendChild(setBox);
        }
    }

    function getSubsetComplexity(algo) {
        if (algo === 'subset_list') return 'O(N * M)';
        if (algo === 'subset_sorting') return 'O(N log N + M log M)';
        if (algo === 'subset_set') return 'O(N + M)';
        return '';
    }

    function stepSubsetEngine(engine) {
        if (engine.status !== 'searching') return;

        engine.steps++;

        if (engine.algo === 'subset_list') {
            engine.comps++;
            const valA = engine.collA[engine.idxA];
            const valB = engine.collB[engine.idxB];

            engine.activeAIdx = engine.idxA;
            engine.activeBIdx = engine.idxB;

            if (valA === valB) {
                engine.matches[engine.idxA] = true;
                engine.msg = `✅ Found ${valA} in B. Advance to next element in A.`;
                engine.idxA++;
                engine.idxB = 0;
                if (engine.idxA >= engine.collA.length) {
                    engine.status = 'subset';
                    engine.msg = `🎉 Subset check passes! All elements of A found in B.`;
                }
            } else {
                engine.idxB++;
                if (engine.idxB >= engine.collB.length) {
                    engine.matches[engine.idxA] = false;
                    engine.status = 'not_subset';
                    engine.msg = `❌ Element ${valA} is not present in Collection B. Failed!`;
                } else {
                    engine.msg = `Compare A[${engine.idxA}] = ${valA} vs B[${engine.idxB}] = ${valB}. No match, continue scanning.`;
                }
            }
        } 
        
        else if (engine.algo === 'subset_set') {
            if (engine.setPhase === 'build') {
                const valB = engine.collB[engine.buildIdx];
                engine.setStorage.add(valB);
                engine.msg = `Loading superset element ${valB} into hash set...`;
                engine.buildIdx++;
                if (engine.buildIdx >= engine.collB.length) {
                    engine.setPhase = 'check';
                }
            } else if (engine.setPhase === 'check') {
                engine.comps++;
                const valA = engine.collA[engine.checkIdx];
                
                if (engine.setStorage.has(valA)) {
                    engine.matches[engine.checkIdx] = true;
                    engine.msg = `⚡ Set lookup: ${valA} found instantly!`;
                    engine.checkIdx++;
                    if (engine.checkIdx >= engine.collA.length) {
                        engine.status = 'subset';
                        engine.msg = `🎉 Subset check passes! Checked all elements in O(1) lookups.`;
                    }
                } else {
                    engine.matches[engine.checkIdx] = false;
                    engine.status = 'not_subset';
                    engine.msg = `❌ Set lookup: ${valA} is absent from set. Failed!`;
                }
            }
        } 
        
        else if (engine.algo === 'subset_sorting') {
            if (engine.sortPhase === 'sorting_a') {
                engine.sortedA = [...engine.collA].sort((a, b) => a - b);
                engine.msg = `Collection A sorted: [${engine.sortedA.join(', ')}]`;
                engine.sortPhase = 'sorting_b';
            } else if (engine.sortPhase === 'sorting_b') {
                engine.sortedB = [...engine.collB].sort((a, b) => a - b);
                engine.msg = `Collection B sorted: [${engine.sortedB.join(', ')}]`;
                engine.sortPhase = 'pointers';
                engine.idxA = 0;
                engine.idxB = 0;
            } else if (engine.sortPhase === 'pointers') {
                engine.comps++;
                const valA = engine.sortedA[engine.idxA];
                const valB = engine.sortedB[engine.idxB];

                if (valA === valB) {
                    engine.matches[engine.idxA] = true;
                    engine.msg = `Pointers: ${valA} === ${valB}. Match! Increment both pointers.`;
                    engine.idxA++;
                    engine.idxB++;
                    if (engine.idxA >= engine.sortedA.length) {
                        engine.status = 'subset';
                        engine.msg = `🎉 Subset check passes! Traversal pointers matched all items.`;
                    }
                } else if (valA > valB) {
                    engine.msg = `Pointers: ${valA} > ${valB}. Superset item is too small. Shift superset pointer.`;
                    engine.idxB++;
                    if (engine.idxB >= engine.sortedB.length) {
                        engine.status = 'not_subset';
                        engine.msg = `❌ Superset depleted. Element ${valA} not found. Failed!`;
                    }
                } else {
                    engine.matches[engine.idxA] = false;
                    engine.status = 'not_subset';
                    engine.msg = `❌ Pointers: A[${engine.idxA}] = ${valA} < B[${engine.idxB}] = ${valB}. Cannot be found. Failed!`;
                }
            }
        }
    }

    function stepSubsetSimulation() {
        stepSubsetEngine(subsetSimState.leftEngine);
        stepSubsetEngine(subsetSimState.rightEngine);

        renderSubsetPanel('left', subsetSimState.leftEngine);
        renderSubsetPanel('right', subsetSimState.rightEngine);

        if (subsetSimState.leftEngine.status !== 'searching' && subsetSimState.rightEngine.status !== 'searching') {
            stopSubsetSimulationTimer();
            subsetSimState.isPlaying = false;
            document.getElementById('sim-subset-play-btn').innerText = '▶ Play';
            document.getElementById('sim-subset-pause-btn').disabled = true;
            document.getElementById('sim-subset-play-btn').disabled = true;
            document.getElementById('sim-subset-step-btn').disabled = true;
        }
    }

    function startSubsetSimulationTimer() {
        stopSubsetSimulationTimer();
        subsetSimInterval = setInterval(stepSubsetSimulation, subsetSimState.speed);
    }

    function stopSubsetSimulationTimer() {
        if (subsetSimInterval) {
            clearInterval(subsetSimInterval);
            subsetSimInterval = null;
        }
    }

    // --- Bind Subset Simulation controls ---
    document.getElementById('sim-subset-play-btn').addEventListener('click', () => {
        if (subsetSimState.isPlaying) return;
        subsetSimState.isPlaying = true;
        document.getElementById('sim-subset-play-btn').innerText = 'Running...';
        document.getElementById('sim-subset-play-btn').disabled = true;
        document.getElementById('sim-subset-pause-btn').disabled = false;
        document.getElementById('sim-subset-step-btn').disabled = true;
        startSubsetSimulationTimer();
    });

    document.getElementById('sim-subset-pause-btn').addEventListener('click', () => {
        subsetSimState.isPlaying = false;
        document.getElementById('sim-subset-play-btn').innerText = '▶ Play';
        document.getElementById('sim-subset-play-btn').disabled = false;
        document.getElementById('sim-subset-pause-btn').disabled = true;
        document.getElementById('sim-subset-step-btn').disabled = false;
        stopSubsetSimulationTimer();
    });

    document.getElementById('sim-subset-step-btn').addEventListener('click', () => {
        stepSubsetSimulation();
    });

    document.getElementById('sim-subset-reset-btn').addEventListener('click', () => {
        resetSubsetSimulation();
    });

    document.getElementById('sim-subset-speed').addEventListener('input', (e) => {
        const val = e.target.value;
        document.getElementById('sim-subset-speed-val').innerText = val;
        subsetSimState.speed = parseInt(val);
        if (subsetSimState.isPlaying) {
            startSubsetSimulationTimer();
        }
    });

    document.getElementById('sim-subset-left-select').addEventListener('change', resetSubsetSimulation);
    document.getElementById('sim-subset-right-select').addEventListener('change', resetSubsetSimulation);

    // --- INITIAL DATA SEEDING ---
    const initSearchArr = [7, 25, 54, 75, 76, 79, 119, 131, 135, 136, 152, 158, 216, 225, 232];
    setupSearchSimulationData(initSearchArr, 131);

    const initCollA = [19, 45, 60, 78, 91];
    const initCollB = [12, 19, 27, 34, 45, 52, 60, 78, 83, 91];
    setupSubsetSimulationData(initCollA, initCollB);
});
