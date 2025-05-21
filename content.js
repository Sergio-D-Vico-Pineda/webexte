chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'findAndClickInput') {
        findAndClickInput(request.searchText);
    }
});

function findAndClickInput(searchText) {
    // Get all input elements
    const inputs = document.querySelectorAll('input');

    inputs.forEach(input => {
        // Check the next sibling for a label
        let label = input.nextElementSibling;
        if (label && label.tagName.toLowerCase() === 'label') {
            const labelText = label.textContent.trim();
            if (labelText.toLowerCase().includes(searchText.toLowerCase())) {
                // Found matching text in the label, click the input
                input.click();
                input.focus();
                found = true;
                return;
            }
        }

        // If no matching label found as next sibling, check the parent element
        const parent = input.parentElement;
        if (!parent) return;

        // Look for a label element within the parent
        const siblingLabel = parent.querySelector('label');
        if (siblingLabel) {
            const labelText = siblingLabel.textContent.trim();
            if (labelText.toLowerCase().includes(searchText.toLowerCase())) {
                // Found matching text in the label, click the input
                input.click();
                input.focus();
                found = true;
                return;
            }
        }
    });
}