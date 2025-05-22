let firstClick = true;
let inputs = [];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message in content.js:', request);
    if (request.action === 'findAndClickInput') {
        const a = findAndClickInput(request.searchText);
        sendResponse(a);
        return;
    }

    if (firstClick) {
        firstClick = false;
        inputs = document.querySelectorAll('input');
        console.log('content.js: findAndClickInpunt: inputs: ', inputs);
    }
});


function findAndClickInput(searchText) {
    // Get all input elements
    let matchCount = 0;
    let lastMatchedInput = null;

    inputs.forEach(input => {
        // Check the next sibling for a label
        /* let label = input.nextElementSibling;
        if (label && label.tagName.toLowerCase() === 'label') {
            const labelText = label.textContent.trim();
            if (labelText.toLowerCase().includes(searchText.toLowerCase())) {
                console.log('a: ' + searchText)
                matchCount++;
                lastMatchedInput = input;
            }
        } */

        // If no matching label found as next sibling, check the parent element
        const parent = input.parentElement;
        if (!parent) return;

        // Look for a label element within the parent
        const siblingLabel = parent.querySelector('label');
        if (siblingLabel) {
            const labelText = siblingLabel.textContent.trim();
            if (labelText.toLowerCase().includes(searchText.toLowerCase())) {
                console.log('b: ' + searchText)
                matchCount++;
                lastMatchedInput = input;
            }
        }
    });

    // Only click if exactly one match is found
    if (matchCount === 1 && lastMatchedInput) {
        console.log('Found exactly one match, clicking input');
        lastMatchedInput.click();
        // lastMatchedInput.focus();
    }

    return { found: matchCount > 0, matchCount };
}