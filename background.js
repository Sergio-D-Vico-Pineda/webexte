// Background script to handle extension initialization
chrome.runtime.onInstalled.addListener(() => {
    console.log('Input Text Matcher extension installed');
});

// NOT NEEDED
// Enable communication between popup and content scripts
/* chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message in background.js:', request);
    if (request.action === 'findAndClickInput') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, request);
        });
    }
});  */