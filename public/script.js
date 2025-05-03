async function performSearch() {
    const searchTerm = document.getElementById('searchInput').value;
    if (!searchTerm) {
        alert('Please enter a search term');
        return;
    }
    
    try {
        const response = await fetch('/api/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ searchTerm })
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayResults(data);
        } else {
            alert('Error: ' + (data.message || data.error));
        }
    } catch (error) {
        alert('Error performing search');
    }
}

function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <h2>Search Results</h2>
        <p>Found ${data.results.length} albums</p>
        <p>Results saved to: ${data.filePath}</p>
        <div class="results-list">
            ${data.results.map(album => `
                <div class="album">
                    <h3>${album.title}</h3>
                    <p>Artist: ${album.artist}</p>
                    <p>Release Date: ${album.releaseDate}</p>
                    <a href="${album.url}" target="_blank">View on Bandcamp</a>
                </div>
            `).join('')}
        </div>
    `;
}

// Add event listener for Enter key
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
}); 