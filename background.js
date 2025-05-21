// Background script to handle extension initialization
chrome.runtime.onInstalled.addListener(() => {
    console.log('Input Text Matcher extension installed');
});

// Enable communication between popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'findAndClickInput') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, request);
        });
    }
}); 