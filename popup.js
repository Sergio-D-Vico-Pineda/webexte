// Function to create a new search item
function createSearchItem(value = '') {
    const searchItem = document.createElement('div');
    searchItem.className = 'search-item';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'search-input';
    input.placeholder = 'Enter text to match...';
    input.value = value;

    const removeButton = document.createElement('button');
    removeButton.className = 'remove-btn';
    removeButton.textContent = '×';

    searchItem.appendChild(input);
    searchItem.appendChild(removeButton);

    return searchItem;
}

// Helper function to initialize default search
function initializeDefaultSearch() {
    const searchContainer = document.querySelector('#searchContainer');
    searchContainer.appendChild(createSearchItem());
}

// Initialize search terms
async function initializeSearchTerms() {
    if (chrome?.storage?.local) {
        try {
            const result = await chrome.storage.local.get(['searchTerms']);
            const searchTerms = result.searchTerms || [];
            const searchContainer = document.querySelector('#searchContainer');

            // Clear existing content and add new search items
            searchContainer.innerHTML = '';
            searchTerms.forEach(term => {
                searchContainer.appendChild(createSearchItem(term));
            });
            if (searchTerms.length === 12) document.querySelector('#add-btn').style.display = 'none';
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
document.querySelector('#add-btn').addEventListener('click', () => {
    const searchContainer = document.querySelector('#searchContainer');
    const currentSearchItems = searchContainer.querySelectorAll('.search-item');

    if (currentSearchItems.length < 12) {
        searchContainer.appendChild(createSearchItem());
        saveSearchTerms();

        // Disable add button if max limit reached
        if (currentSearchItems.length + 1 >= 12) {
            document.querySelector('#add-btn').style.display = 'none';
        }
    }
});

// Remove search field
document.querySelector('#searchContainer').addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-btn')) {
        const searchItems = document.querySelectorAll('.search-item');
        if (searchItems.length > 1) {
            e.target.closest('.search-item').remove();
            saveSearchTerms();

            // Re-enable add button if below max limit
            if (searchItems.length <= 12) {
                document.querySelector('#add-btn').style.display = 'block';
            }
        } else {
            alert('You cannot remove the last search field.');
        }
    }
});

// Save on input change
document.querySelector('#searchContainer').addEventListener('input', (e) => {
    if (e.target.classList.contains('search-input')) {
        saveSearchTerms();
    }
});

// Create results popup
function showResults(results) {
    const resultsPopup = document.createElement('div');
    resultsPopup.className = 'results-popup';

    const resultsContent = document.createElement('div');
    resultsContent.className = 'results-content';

    const unmatchedTexts = results.filter(r => r.matchCount === 0).map(r => r.text);
    const singleMatches = results.filter(r => r.matchCount === 1).map(r => r.text);
    const multipleMatches = results.filter(r => r.matchCount > 1).map(r => `${r.text} (${r.matchCount} matches)`);

    if (singleMatches.length > 0) {
        const matched = document.createElement('p');
        matched.className = 'matched';
        matched.textContent = `Clicked: ${singleMatches.join(', ')}`;
        resultsContent.appendChild(matched);
    }

    if (unmatchedTexts.length > 0) {
        const unmatched = document.createElement('p');
        unmatched.className = 'unmatched';
        unmatched.textContent = `Not found: ${unmatchedTexts.join(', ')}`;
        resultsContent.appendChild(unmatched);
    }

    if (multipleMatches.length > 0) {
        const multiple = document.createElement('p');
        multiple.className = 'multiple-matches';
        multiple.textContent = `Multiple matches found: ${multipleMatches.join(', ')}`;
        resultsContent.appendChild(multiple);
    }

    resultsPopup.addEventListener('click', () => {
        resultsPopup.remove();
    });

    resultsPopup.appendChild(resultsContent);
    document.body.appendChild(resultsPopup);
    setTimeout(() => resultsPopup.remove(), 6500);
}

// Handle search
document.querySelector('#findButton').addEventListener('click', async () => {
    const searchInputs = document.querySelectorAll('.search-input');
    const searchTexts = Array.from(searchInputs)
        .map(input => input.value.trim())
        .filter(text => text.length > 0);

    if (searchTexts.length > 0) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) {
                throw new Error('No active tab found');
            }

            // Check if content script is ready
            try {
                await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
            } catch (connectionError) {
                throw new Error('Content script not ready. Please refresh the page.');
            }

            const results = [];

            for (const searchText of searchTexts) {
                try {
                    const response = await chrome.tabs.sendMessage(tab.id, {
                        action: 'findAndClickInput',
                        searchText: searchText
                    });
                    console.log('Response from content script:', response);
                    results.push({
                        text: searchText,
                        matchCount: response?.matchCount || 0
                    });
                } catch (messageError) {
                    console.error('Message sending failed:', messageError);
                    results.push({
                        text: searchText,
                        matchCount: 0
                    });
                }
            }
            showResults(results);
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Please refresh the page and try again.');
        }
    }
});

// Handle Enter key press on any search input
document.querySelector('#searchContainer').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('search-input')) {
        document.querySelector('#findButton').click();
    }
});