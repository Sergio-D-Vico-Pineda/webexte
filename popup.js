// Function to create a new search item
function createSearchItem(value = '') {
    const searchItem = document.createElement('div');
    searchItem.className = 'search-item';
    searchItem.innerHTML = `
    <input type="text" class="search-input" placeholder="Enter text to match..." value="${value}">
    <button class="remove-btn">×</button>
  `;
    return searchItem;
}

// Initialize search terms
async function initializeSearchTerms() {
    if (chrome?.storage?.local) {
        try {
            const result = await chrome.storage.local.get(['searchTerms']);
            const searchTerms = result.searchTerms || [];
            const searchContainer = document.getElementById('searchContainer');

            // Clear existing content and add new search items
            searchContainer.innerHTML = '';
            searchTerms.forEach(term => {
                searchContainer.appendChild(createSearchItem(term));
            });
        } catch (error) {
            console.error('Storage error:', error);
            initializeDefaultSearch();
        }
    } else {
        console.error('Chrome storage API not available');
        initializeDefaultSearch();
    }
}

// Load saved search terms
initializeSearchTerms();

// Helper function to initialize default search
function initializeDefaultSearch() {
    const searchContainer = document.getElementById('searchContainer');
    searchContainer.appendChild(createSearchItem());
}

// Save search terms function
function saveSearchTerms() {
    if (chrome && chrome.storage && chrome.storage.local) {
        const searchInputs = document.querySelectorAll('.search-input');
        const searchTerms = Array.from(searchInputs).map(input => input.value.trim());
        chrome.storage.local.set({ searchTerms }).catch(error => {
            console.error('Error saving search terms:', error);
        });
    }
}

// Add new search field
document.querySelector('.add-btn').addEventListener('click', () => {
    const searchContainer = document.getElementById('searchContainer');
    searchContainer.appendChild(createSearchItem());
    saveSearchTerms();
});

// Remove search field
document.getElementById('searchContainer').addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-btn')) {
        const searchItems = document.querySelectorAll('.search-item');
        if (searchItems.length > 1) {
            e.target.closest('.search-item').remove();
            saveSearchTerms();
        }
    }
});

// Save on input change
document.getElementById('searchContainer').addEventListener('input', (e) => {
    if (e.target.classList.contains('search-input')) {
        saveSearchTerms();
    }
});

// Create results popup
function showResults(matchedTexts, unmatchedTexts) {
    const resultsPopup = document.createElement('div');
    resultsPopup.className = 'results-popup';
    resultsPopup.innerHTML = `
    <div class="results-content">
      ${unmatchedTexts.length > 0 ? `
        <p class="unmatched">Not found: ${unmatchedTexts.join(', ')}</p>
      ` : ''}
      ${matchedTexts.length > 0 ? `
        <p class="matched">Found: ${matchedTexts.join(', ')}</p>
      ` : ''}
    </div>
  `;
    document.body.appendChild(resultsPopup);
    setTimeout(() => resultsPopup.remove(), 5000);
}

// Handle search
document.getElementById('findButton').addEventListener('click', async () => {
    const searchInputs = document.querySelectorAll('.search-input');
    const searchTexts = Array.from(searchInputs)
        .map(input => input.value.trim())
        .filter(text => text.length > 0);

    if (searchTexts.length > 0) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const matchedTexts = [];
            const unmatchedTexts = [];

            for (const searchText of searchTexts) {
                const response = await chrome.tabs.sendMessage(tab.id, {
                    action: 'findAndClickInput',
                    searchText: searchText
                });
                if (response && response.found) {
                    matchedTexts.push(searchText);
                } else {
                    unmatchedTexts.push(searchText);
                }
            }
            showResults(matchedTexts, unmatchedTexts);
        } catch (error) {
            console.error('Error:', error);
            alert('Please refresh the page and try again.');
        }
    }
});

// Handle Enter key press on any search input
document.getElementById('searchContainer').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('search-input')) {
        document.getElementById('findButton').click();
    }
});