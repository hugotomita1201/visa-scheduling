// Popup script for US Visa Scheduling Auto-Filler

let currentData = null;

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Add active class to clicked tab
    tab.classList.add('active');
    const tabId = tab.dataset.tab + 'Tab';
    document.getElementById(tabId).classList.add('active');
    
    // Save active tab to storage
    chrome.storage.local.set({ activeTab: tab.dataset.tab });
  });
});

// Load saved data on popup open
document.addEventListener('DOMContentLoaded', () => {
  chrome.runtime.sendMessage({ action: 'getData' }, (response) => {
    if (response && response.data) {
      document.getElementById('dataInput').value = JSON.stringify(response.data, null, 2);
      currentData = response.data;
      updateFieldCount();
      updatePersonSelector();
      
      // Check if we should show person selector (data has person info)
      if (hasPersonData()) {
        showPersonSelector();
        showStatus('Ready to fill form', 'success');
      } else {
        showStatus('Data loaded from storage', 'success');
      }
    }
  });
  
  // Also check chrome.storage.local in case background script isn't available
  chrome.storage.local.get(['visaData', 'selectedPersonId', 'activeTab', 'uiState'], (result) => {
    if (result.visaData && !currentData) {
      currentData = result.visaData;
      document.getElementById('dataInput').value = JSON.stringify(currentData, null, 2);
      updateFieldCount();
      updatePersonSelector();
      
      // Restore UI state (person selector vs data input)
      if (result.uiState === 'personSelector' && hasPersonData()) {
        showPersonSelector();
        showStatus('Ready to fill form', 'success');
      } else if (hasPersonData() && !result.uiState) {
        // Default to person selector if data has person info
        showPersonSelector();
        showStatus('Ready to fill form', 'success');
      }
    }
    
    // Restore active tab
    if (result.activeTab) {
      // Remove active class from all tabs
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Add active class to saved tab
      const savedTab = document.querySelector(`[data-tab="${result.activeTab}"]`);
      if (savedTab) {
        savedTab.classList.add('active');
        const tabId = result.activeTab + 'Tab';
        const tabContent = document.getElementById(tabId);
        if (tabContent) {
          tabContent.classList.add('active');
        }
      }
    }
  });
  
  // Check if we're on a supported site
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url) {
      const url = tabs[0].url;
      if (!url.includes('usvisascheduling.com') && !url.includes('ais.usvisa-info.com')) {
        showStatus('Navigate to US Visa Scheduling site to use this extension', 'warning');
      }
    }
  });
});

// Load data button
document.getElementById('loadBtn').addEventListener('click', () => {
  const input = document.getElementById('dataInput').value.trim();
  
  if (!input) {
    showStatus('Please paste your data first', 'error');
    return;
  }
  
  try {
    currentData = JSON.parse(input);
    
    // Save to storage
    chrome.runtime.sendMessage({ 
      action: 'saveData', 
      data: currentData 
    }, (response) => {
      if (response && response.success) {
        showStatus('Data loaded and saved successfully!', 'success');
        updateFieldCount();
        updatePersonSelector();
        
        // Save to local storage for content script
        chrome.storage.local.set({ visaData: currentData }, () => {
          console.log('Data saved to local storage for content script');
        });
        
        // Auto-switch to Fill Form tab and show person selector
        if (hasPersonData()) {
          showPersonSelector();
        }
      }
    });
  } catch (e) {
    showStatus('Invalid JSON format. Please check your data.', 'error');
    console.error('JSON parse error:', e);
  }
});

// Clear button
document.getElementById('clearBtn').addEventListener('click', () => {
  document.getElementById('dataInput').value = '';
  currentData = null;
  
  chrome.runtime.sendMessage({ action: 'clearData' }, (response) => {
    if (response && response.success) {
      showStatus('Data cleared', 'info');
      updateFieldCount();
      hidePersonSelector();
      chrome.storage.local.remove(['visaData', 'selectedPersonId']);
    }
  });
});

// Check if data has person information
function hasPersonData() {
  return currentData && (currentData.applicant || currentData.dependents || currentData.atlas_first_name || currentData.firstName);
}

// Show person selector and hide data input
function showPersonSelector() {
  document.getElementById('personSelectionArea').style.display = 'block';
  document.getElementById('dataInputArea').style.display = 'none';
  updatePersonSelector();
  // Save UI state
  chrome.storage.local.set({ uiState: 'personSelector' });
}

// Hide person selector and show data input
function hidePersonSelector() {
  document.getElementById('personSelectionArea').style.display = 'none';
  document.getElementById('dataInputArea').style.display = 'block';
  // Save UI state
  chrome.storage.local.set({ uiState: 'dataInput' });
}

// Fill selected person button
document.getElementById('fillSelectedPersonBtn').addEventListener('click', async () => {
  const selectedRadio = document.querySelector('input[name="personRadio"]:checked');
  
  if (!selectedRadio) {
    showStatus('Please select a person first', 'error');
    return;
  }
  
  const personId = selectedRadio.value;
  let personData = null;
  
  if (personId === 'main_applicant') {
    // Get main applicant data
    personData = currentData.applicant || currentData;
  } else {
    // Get dependent data
    if (currentData.dependents) {
      personData = currentData.dependents.find(d => d.id === personId);
    }
  }
  
  if (!personData) {
    showStatus('Person data not found', 'error');
    return;
  }
  
  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.url || (!tab.url.includes('usvisascheduling.com') && !tab.url.includes('ais.usvisa-info.com') && !tab.url.includes('ayobaspremium.jp'))) {
    showStatus('Please navigate to the US Visa Scheduling or Payment form first', 'error');
    return;
  }
  
  // Show loading spinner
  document.getElementById('loadingSpinner').style.display = 'block';
  document.getElementById('fillSelectedPersonBtn').disabled = true;
  
  try {
    // First inject the content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    console.log('Content script injected');
  } catch (e) {
    console.log('Content script might already be injected:', e);
  }
  
  // Small delay to ensure script is loaded
  setTimeout(() => {
    // Send message directly to the tab
    chrome.tabs.sendMessage(tab.id, { 
      action: 'fillForm', 
      data: personData 
    }, (response) => {
      // Hide loading spinner
      document.getElementById('loadingSpinner').style.display = 'none';
      document.getElementById('fillSelectedPersonBtn').disabled = false;
      
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError);
        showStatus('Error: ' + chrome.runtime.lastError.message, 'error');
      } else if (response && response.success) {
        const personName = personId === 'main_applicant' ? 'Main Applicant' : 
                          (personData.displayName || `${personData.firstname} ${personData.lastname}`);
        showStatus(`Filled form with ${personName}`, 'success');
        // Auto-close popup after successful fill to avoid covering form fields
        setTimeout(() => {
          window.close();
        }, 1500);
      } else {
        showStatus('Form filling completed. Check the page.', 'info');
        // Auto-close popup after completion
        setTimeout(() => {
          window.close();
        }, 2000);
      }
    });
  }, 100);
});


// Edit Data button - go back to data input
document.getElementById('editDataBtn').addEventListener('click', () => {
  hidePersonSelector();
  showStatus('Edit your data and click Load Data again', 'info');
});

// Detect fields button
document.getElementById('detectBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'detectFields' }, (response) => {
        if (response && response.fields) {
          displayDetectedFields(response.fields);
        } else {
          showStatus('Could not detect fields. Make sure you are on a form page.', 'error');
        }
      });
    }
  });
});

// Helper functions
function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 5000);
}

function updateFieldCount() {
  const countDiv = document.getElementById('fieldCount');
  if (currentData) {
    let personCount = 0;
    let fieldCount = 0;
    
    // Count main applicant
    if (currentData.applicant || currentData.atlas_first_name || currentData.firstName) {
      personCount = 1;
      const applicantData = currentData.applicant || currentData;
      fieldCount = countFields(applicantData);
    }
    
    // Count dependents
    if (currentData.dependents && Array.isArray(currentData.dependents)) {
      personCount += currentData.dependents.length;
    }
    
    let text = `${fieldCount} fields ready • ${personCount} person${personCount !== 1 ? 's' : ''} loaded`;
    countDiv.textContent = text;
  } else {
    countDiv.textContent = '';
  }
}

function updatePersonSelector() {
  const personRadioList = document.getElementById('personRadioList');
  const fillBtn = document.getElementById('fillSelectedPersonBtn');
  
  if (!hasPersonData()) {
    personRadioList.innerHTML = '<p style="color: #666;">No data loaded yet.</p>';
    fillBtn.disabled = true;
    return;
  }
  
  let html = '';
  const persons = [];
  
  // Add main applicant
  if (currentData.applicant || currentData.atlas_first_name || currentData.firstName) {
    const applicantData = currentData.applicant || currentData;
    const name = applicantData.atlas_first_name ? 
                  `${applicantData.atlas_first_name} ${applicantData.atlas_last_name}` :
                  applicantData.firstName ? 
                  `${applicantData.firstName} ${applicantData.lastName}` :
                  'Main Applicant';
    
    persons.push({
      id: 'main_applicant',
      name: name,
      type: 'Main Applicant',
      isMain: true
    });
  }
  
  // Add dependents
  if (currentData.dependents && currentData.dependents.length > 0) {
    currentData.dependents.forEach((dep, index) => {
      const name = dep.displayName || 
                   `${dep.firstname || dep.atlas_first_name} ${dep.lastname || dep.atlas_last_name}` || 
                   `Dependent ${index + 1}`;
      const relation = dep.atlas_relation_to_applicant || 'Dependent';
      
      persons.push({
        id: dep.id || `dep_${index}`,
        name: name,
        type: relation,
        isMain: false
      });
    });
  }
  
  // Generate HTML for all persons
  persons.forEach((person, index) => {
    html += `<label class="person-radio-item ${person.isMain ? 'applicant' : ''}" for="person_${person.id}">`;
    html += `  <input type="radio" id="person_${person.id}" name="personRadio" value="${person.id}">`;
    html += `  <div class="person-info">`;
    html += `    <div class="person-name">${person.name}</div>`;
    html += `    <div class="person-type ${person.isMain ? 'main' : ''}">${person.type}</div>`;
    html += `  </div>`;
    html += `</label>`;
  });
  
  personRadioList.innerHTML = html;
  
  // Add event listeners to radio buttons
  document.querySelectorAll('input[name="personRadio"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      // Update visual selection
      document.querySelectorAll('.person-radio-item').forEach(item => {
        item.classList.remove('selected');
      });
      e.target.closest('.person-radio-item').classList.add('selected');
      
      // Enable fill button
      fillBtn.disabled = false;
      
      // Save selected person to storage
      chrome.storage.local.set({ selectedPersonId: e.target.value }, () => {
        console.log('Selected person saved:', e.target.value);
      });
    });
  });
  
  // Restore previously selected person if any
  chrome.storage.local.get(['selectedPersonId'], (result) => {
    if (result.selectedPersonId) {
      const radio = document.getElementById(`person_${result.selectedPersonId}`);
      if (radio) {
        radio.checked = true;
        radio.closest('.person-radio-item').classList.add('selected');
        fillBtn.disabled = false;
      }
    }
  });
}

function countFields(obj, count = 0) {
  for (let key in obj) {
    if (obj[key] !== null && obj[key] !== undefined) {
      if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        count = countFields(obj[key], count);
      } else {
        count++;
      }
    }
  }
  return count;
}

function displayDetectedFields(fields) {
  const container = document.getElementById('detectedFields');
  
  if (fields.length === 0) {
    container.innerHTML = '<div class="field-item">No fields detected on this page</div>';
  } else {
    let html = `<div style="margin-bottom: 10px; font-weight: 600;">Found ${fields.length} fields:</div>`;
    
    fields.forEach(field => {
      const label = field.label || field.id || field.name || 'Unnamed field';
      const type = field.type;
      const required = field.required ? ' (required)' : '';
      
      html += `<div class="field-item">• ${label} [${type}]${required}</div>`;
    });
    
    container.innerHTML = html;
  }
  
  container.style.display = 'block';
}

// Example data button (for testing)
document.addEventListener('keydown', (e) => {
  // Ctrl+E or Cmd+E to load example data
  if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
    e.preventDefault();
    const exampleData = {
      firstName: "John",
      lastName: "Smith",
      middleName: "Robert",
      dateOfBirth: "1990-03-15",
      birthCountry: "United Kingdom",
      nationality: "United Kingdom",
      gender: "M",
      maritalStatus: "Single",
      nationalId: "AB123456",
      passport: {
        number: "987654321",
        issuingCountry: "United Kingdom",
        issueDate: "2020-06-01",
        expiryDate: "2030-06-01",
        issueCity: "London"
      },
      homeAddress: {
        street1: "123 Main Street",
        street2: "Apt 4B",
        city: "London",
        state: "England",
        postalCode: "SW1A 1AA",
        country: "United Kingdom"
      },
      usAddress: {
        street1: "456 Oak Avenue",
        city: "New York",
        state: "New York",
        zipCode: "10001"
      },
      email: "john.smith@email.com",
      phone: "+44 20 1234 5678",
      mobile: "+44 7700 900123",
      father: {
        firstName: "Robert",
        lastName: "Smith",
        nationality: "United Kingdom"
      },
      mother: {
        firstName: "Mary",
        lastName: "Smith",
        nationality: "United Kingdom"
      },
      purposeOfTrip: "Business",
      arrivalDate: "2024-06-01",
      departureDate: "2024-06-15",
      previousUSTravel: true,
      previousVisaNumber: "123ABC456",
      previousVisaIssueDate: "2019-05-01"
    };
    
    document.getElementById('dataInput').value = JSON.stringify(exampleData, null, 2);
    showStatus('Example data loaded (Ctrl+E)', 'info');
  }
});