document.addEventListener('DOMContentLoaded', () => {
    
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
                alert('Error: ' + data.message);
            }
        } catch (error) {
            alert('Failed to connect to backend server.');
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
});
