// Background Service Worker for US Visa Scheduling Auto-Filler

console.log('US Visa Scheduling Extension - Background service worker started');

// Store data temporarily
let storedData = null;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveData') {
    // Save data to chrome storage
    chrome.storage.local.set({ visaData: request.data }, () => {
      console.log('Data saved to storage');
      storedData = request.data;
      sendResponse({ success: true });
    });
    return true;
  } 
  
  else if (request.action === 'getData') {
    // Get data from storage
    chrome.storage.local.get(['visaData'], (result) => {
      sendResponse({ data: result.visaData || storedData });
    });
    return true;
  }
  
  else if (request.action === 'clearData') {
    // Clear stored data
    chrome.storage.local.clear(() => {
      storedData = null;
      sendResponse({ success: true });
    });
    return true;
  }
  
  else if (request.action === 'fillCurrentTab') {
    // Get current tab and inject content script if needed
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]) {
        const tab = tabs[0];
        
        // First, try to inject the content script
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          console.log('Content script injected');
        } catch (e) {
          console.log('Content script might already be injected:', e);
        }
        
        // Then send the message
        chrome.tabs.sendMessage(tab.id, {
          action: 'fillForm',
          data: request.data
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error:', chrome.runtime.lastError);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse(response || { success: true });
          }
        });
      }
    });
    return true;
  }
});

// Listen for tab updates to auto-detect visa scheduling pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes('usvisascheduling.com') || tab.url.includes('ais.usvisa-info.com')) {
      // Show extension icon as active
      chrome.action.setBadgeText({ text: '✓', tabId: tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50', tabId: tabId });
      
      // Clear badge after 3 seconds
      setTimeout(() => {
        chrome.action.setBadgeText({ text: '', tabId: tabId });
      }, 3000);
    }
  }
});

// Handle installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('US Visa Scheduling Extension installed');
  
  // Set default data structure
  const defaultData = {
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    birthCountry: '',
    nationality: '',
    gender: '',
    maritalStatus: '',
    passport: {
      number: '',
      issuingCountry: '',
      issueDate: '',
      expiryDate: ''
    },
    homeAddress: {
      street1: '',
      street2: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    },
    email: '',
    phone: ''
  };
  
  // Save default structure as example
  chrome.storage.local.set({ exampleData: defaultData });
});