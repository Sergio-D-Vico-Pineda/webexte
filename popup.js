// Configuration for section limits
const SECTION_LIMITS = {
    primeros: 5,
    segundos: 5,
    postres: 5,
    bebidas: 5
};

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

// Initialize search terms
async function initializeSearchTerms() {
    if (chrome?.storage?.local) {
        try {
            const result = await chrome.storage.local.get(['sectionSearchTerms']);
            const sectionTerms = result.sectionSearchTerms || {};

            Object.keys(SECTION_LIMITS).forEach(section => {
                const container = document.getElementById(`${section}Container`);
                const terms = sectionTerms[section] || [''];

                container.innerHTML = '';
                terms.forEach(term => {
                    container.appendChild(createSearchItem(term));
                });

                updateAddButtonVisibility(section);
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

// Helper function to initialize default search
function initializeDefaultSearch() {
    Object.keys(SECTION_LIMITS).forEach(section => {
        const container = document.getElementById(`${section}Container`);
        container.innerHTML = '';
        container.appendChild(createSearchItem());
    });
}

// Save search terms function
function saveSearchTerms() {
    if (chrome?.storage?.local) {
        const sectionTerms = {};

        Object.keys(SECTION_LIMITS).forEach(section => {
            const inputs = document.querySelectorAll(`#${section}Container .search-input`);
            sectionTerms[section] = Array.from(inputs).map(input => input.value.trim());
        });

        chrome.storage.local.set({ sectionSearchTerms: sectionTerms }).catch(error => {
            console.error('Error saving search terms:', error);
        });
    }
}

// Update add button visibility
function updateAddButtonVisibility(section) {
    const container = document.getElementById(`${section}Container`);
    const addButton = document.querySelector(`#${section}`);
    const currentItems = container.querySelectorAll('.search-item').length;

    addButton.style.display = currentItems >= SECTION_LIMITS[section] ? 'none' : 'block';
}

// Add new search field for specific section
document.querySelectorAll('.add-btn').forEach(button => {
    button.addEventListener('click', () => {
        const section = button.id;
        const container = document.getElementById(`${section}Container`);
        const currentItems = container.querySelectorAll('.search-item').length;

        if (currentItems < SECTION_LIMITS[section]) {
            container.appendChild(createSearchItem());
            saveSearchTerms();
            updateAddButtonVisibility(section);
        }
    });
});

// Remove search field
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-btn')) {
        const searchItem = e.target.closest('.search-item');
        const container = searchItem.closest('.input-container');
        const section = container.id.replace('Container', '');

        searchItem.remove();
        saveSearchTerms();
        updateAddButtonVisibility(section);

        // TODO: add here if there isnt any input, disable the find and click inputs and clear all inputs buttons
    }
});

// Save on input change
document.addEventListener('input', (e) => {
    if (e.target.classList.contains('search-input')) {
        saveSearchTerms();
    }
});

// Clear all inputs
document.getElementById('clearAllBtn').addEventListener('click', () => {
    document.querySelectorAll('.search-input').forEach(input => {
        input.value = '';
    });
    saveSearchTerms();
});

// Load saved search terms
initializeSearchTerms();

// Create results popup
function showResults(results) {
    const resultsPopup = document.createElement('div');
    resultsPopup.className = 'results-popup';

    const resultsContent = document.createElement('div');
    resultsContent.className = 'results-content';

    const unmatchedTexts = results.filter(r => r.matchCount === 0).map(r => {
        if (!r.suggestion) return r.text;
        const text = document.createElement('span');
        text.textContent = `${r.text} (Sug: ${r.suggestion})`;
        const tryButton = document.createElement('button');
        tryButton.textContent = 'Try';
        tryButton.className = 'try-suggestion-btn';
        tryButton.onclick = async (e) => {
            e.stopPropagation();
            const searchInputs = document.querySelectorAll('.search-input');
            const currentInput = Array.from(searchInputs).find(input => input.value.trim() === r.text);
            if (currentInput) {
                currentInput.value = r.suggestion;
                // Create a single-item search for this suggestion
                const singleSearch = async () => {
                    try {
                        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                        if (!tab) throw new Error('No active tab found');

                        await chrome.tabs.sendMessage(tab.id, { action: 'ping' });

                        const response = await chrome.tabs.sendMessage(tab.id, {
                            action: 'findAndClickInput',
                            searchText: r.suggestion
                        });

                        const results = [{
                            text: r.suggestion,
                            matchCount: response?.matchCount || 0,
                            suggestion: response?.bestMatch || ''
                        }];

                        showResults(results);
                    } catch (error) {
                        console.error('Error:', error);
                        alert(error.message || 'Please refresh the page and try again.');
                    }
                };
                singleSearch();
            }
        };
        const container = document.createElement('div');
        container.className = 'suggestion-container';
        container.appendChild(text);
        container.appendChild(tryButton);
        return container;
    });
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
        unmatched.textContent = 'Not found:';
        unmatchedTexts.forEach((item, index) => {
            if (index > 0) unmatched.appendChild(document.createTextNode(', '));
            unmatched.appendChild(typeof item === 'string' ? document.createTextNode(item) : item);
        });
        resultsContent.appendChild(unmatched);
    }

    if (multipleMatches.length > 0) {
        const multiple = document.createElement('p');
        multiple.className = 'multiple-matches';
        multiple.textContent = `Multiple matches found: ${multipleMatches.join(', ')}`;
        resultsContent.appendChild(multiple);
    }

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'close-popup-btn';
    closeButton.textContent = '×';
    closeButton.onclick = () => resultsPopup.remove();
    resultsContent.appendChild(closeButton);

    /* resultsPopup.addEventListener('click', () => {
        resultsPopup.remove();
    }); */

    resultsPopup.appendChild(resultsContent);
    document.body.appendChild(resultsPopup);
    // setTimeout(() => resultsPopup.remove(), 6500);
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
                        matchCount: response?.matchCount || 0,
                        suggestion: response?.bestMatch || ''
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
document.querySelectorAll('input-container').forEach(container => {
    container.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.classList.contains('search-input')) {
            document.querySelector('#findButton').click();
        }
    });
})