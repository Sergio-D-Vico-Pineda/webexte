let firstClick = true;
let inputs = [];

function levenshtein(a, b) {
    const matrix = Array(b.length + 1).fill().map(() => Array(a.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
            const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1, // Eliminación
                matrix[j - 1][i] + 1, // Inserción
                matrix[j - 1][i - 1] + indicator // Sustitución
            );
        }
    }
    return matrix[b.length][a.length];
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
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
    let bestMatch = { input: null, distance: Infinity, labelText: '' };

    try {
        inputs.forEach(input => {
            const parent = input.parentElement;
            if (!parent) return;

            const siblingLabel = parent.querySelector('label');
            if (siblingLabel) {
                const labelText = siblingLabel.textContent.trim();
                const searchTextLower = searchText.toLowerCase();
                const labelTextLower = labelText.toLowerCase();

                // Calcular distancia de Levenshtein
                if (labelTextLower === searchTextLower) {
                    matchCount++;
                    lastMatchedInput = input;
                    throw new Error('Exact match found'); // Stop the iteration now
                } else {
                    const distance = levenshtein(searchTextLower, labelTextLower);
                    console.log(`Distance for "${searchText}" to "${labelText}": ${distance}`);
                    if (distance < bestMatch.distance) {
                        bestMatch = { input, distance, labelText };
                    }
                }
            }
        });
    } catch (error) {
        console.log(error.message + ', stopping iteration');
    }

    // Si hay una coincidencia exacta, hacer clic
    if (matchCount === 1 && lastMatchedInput) {
        console.log('Found exactly one match, clicking input');
        lastMatchedInput.click();
    } else if (matchCount === 0 && bestMatch.input) {
        // Si no hay coincidencias exactas pero hay una similar, incluirla en la respuesta
        console.log('Found similar match:', bestMatch.labelText);
    }

    return { found: matchCount > 0, matchCount, bestMatch: bestMatch.labelText };

}