// US Visa Scheduling Auto-Filler Content Script with Dependent Management
console.log('US Visa Scheduling Auto-Filler v1.0.9 loaded');

class VisaSchedulingFiller {
  constructor() {
    this.currentData = null;
    this.dependents = [];
    this.filledFields = new Set();
    this.selectorVisible = false;
    this.init();
  }

  init() {
    // Listen for messages from popup or background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'fillForm') {
        this.fillForm(request.data);
        sendResponse({ success: true });
      } else if (request.action === 'detectFields') {
        const fields = this.detectFields();
        sendResponse({ fields: fields });
      } else if (request.action === 'getPageInfo') {
        sendResponse({ 
          url: window.location.href,
          title: document.title,
          pageType: this.detectPageType()
        });
      } else if (request.action === 'fillDependentData') {
        // Direct fill with dependent data from popup
        if (request.dependent) {
          this.fillDependentData(request.dependent);
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, message: 'No dependent data provided' });
        }
      }
    });

    // Auto-detect page and show notification
    const pageType = this.detectPageType();
    if (pageType !== 'unknown') {
      console.log(`Detected page: ${pageType}`);
    }
    
    // Removed auto-show selector - now triggered manually via popup button
    // if (this.isOnDependentPage()) {
    //   this.loadDependentsFromStorage();
    //   this.createDependentSelector();
    // }
  }
  
  // Check if we're on a dependent-related page
  isOnDependentPage() {
    const url = window.location.href;
    const title = document.title;
    return (
      url.includes('manage_dependents') || 
      url.includes('daddcontact') || 
      url.includes('dep_applicant_add') ||
      title.includes('Dependent Contact') ||
      title.includes('Dependent Applicant')
    );
  }
  
  // Load dependents from storage
  async loadDependentsFromStorage() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['visaData'], (result) => {
        if (result.visaData && result.visaData.dependents) {
          this.dependents = result.visaData.dependents;
          console.log(`Loaded ${this.dependents.length} dependents from storage`);
        }
        resolve();
      });
    });
  }

  // Detect which page we're on
  detectPageType() {
    const path = window.location.pathname;
    const title = document.title.toLowerCase();
    const url = window.location.href;
    
    // Check for payment page
    if (url.includes('ayobaspremium') || title.includes('ayobas premium') || path.includes('payment')) {
      return 'payment';
    } else if (path.includes('applicant_details') || title.includes('applicant')) {
      return 'applicant_details';
    } else if (path.includes('family') || title.includes('family')) {
      return 'family_details';
    } else if (path.includes('travel') || title.includes('travel')) {
      return 'travel_info';
    } else if (path.includes('address') || title.includes('address')) {
      return 'address';
    } else if (path.includes('passport') || title.includes('passport')) {
      return 'passport';
    } else if (path.includes('contact') || title.includes('contact')) {
      return 'contact_info';
    } else if (path.includes('schedule') || title.includes('appointment')) {
      return 'appointment';
    }
    
    return 'unknown';
  }

  // Detect all fields on current page
  detectFields() {
    const fields = [];
    
    document.querySelectorAll('input, select, textarea').forEach(element => {
      if (element.type === 'hidden' || element.type === 'submit') return;
      if (!element.offsetParent) return; // Skip invisible fields
      
      const field = {
        id: element.id || '',
        name: element.name || '',
        type: element.type || element.tagName.toLowerCase(),
        label: this.getLabel(element),
        value: element.value || '',
        required: element.required || element.hasAttribute('required')
      };
      
      if (element.tagName === 'SELECT') {
        field.options = Array.from(element.options).slice(0, 5).map(opt => ({
          text: opt.text,
          value: opt.value
        }));
        field.optionCount = element.options.length;
      }
      
      fields.push(field);
    });
    
    return fields;
  }

  // Get label for a field
  getLabel(element) {
    // Try multiple methods to find label
    const labelFor = document.querySelector(`label[for="${element.id}"]`);
    if (labelFor) return labelFor.textContent.trim();
    
    const parentLabel = element.closest('label');
    if (parentLabel) {
      const text = parentLabel.textContent;
      return text.replace(element.value || '', '').trim();
    }
    
    if (element.placeholder) return element.placeholder;
    if (element.getAttribute('aria-label')) return element.getAttribute('aria-label');
    
    // Look for nearby text
    const parent = element.closest('.form-group, .field-wrapper, div');
    if (parent) {
      const labels = parent.querySelectorAll('label');
      if (labels.length > 0) {
        return labels[0].textContent.trim();
      }
    }
    
    return element.name || element.id || '';
  }

  // Main form filling function
  fillForm(data) {
    if (!data) {
      console.log('No data to fill');
      return;
    }

    this.currentData = data;
    this.filledFields.clear();
    
    console.log('Starting form fill with data:', data);
    
    // Check if data has atlas_ fields (new format)
    const hasAtlasFields = Object.keys(data).some(key => key.startsWith('atlas_'));
    
    if (hasAtlasFields) {
      // Direct filling with atlas_ fields
      console.log('Using atlas_ field format');
      this.fillGenericFields(data);
    } else {
      // Legacy format - use page-specific functions
      const pageType = this.detectPageType();
      
      switch(pageType) {
        case 'payment':
          this.fillPaymentPage(data);
          break;
        case 'applicant_details':
          this.fillApplicantDetails(data);
          break;
        case 'family_details':
          this.fillFamilyDetails(data);
          break;
        case 'travel_info':
          this.fillTravelInfo(data);
          break;
        case 'address':
          this.fillAddress(data);
          break;
        case 'passport':
          this.fillPassport(data);
          break;
        case 'contact_info':
          this.fillContactInfo(data);
          break;
        default:
          // Try to fill any matching fields
          this.fillGenericFields(data);
      }
    }
    
    console.log(`Form filling complete. Filled ${this.filledFields.size} fields`);
  }

  // Fill applicant details page - Using actual atlas_ field IDs
  fillApplicantDetails(data) {
    // Personal information
    this.fillField('atlas_first_name', data.atlas_first_name);
    this.fillField('atlas_last_name', data.atlas_last_name);
    
    // Birth information
    this.fillField('atlas_birthdate_datepicker_description', data.atlas_birthdate_datepicker_description);
    this.fillField('atlas_pob_country_temp', data.atlas_pob_country_temp);
    
    // Country/Nationality - Use text matching for dropdowns
    this.fillDropdownByText('atlas_country', data.atlas_country);
    this.fillDropdownByText('atlas_nationality', data.atlas_nationality);
    
    // Contact information
    this.fillField('atlas_email', data.atlas_email);
    this.fillDropdownByText('atlas_home_phone_country_code', data.atlas_home_phone_country_code);
    this.fillField('atlas_home_phone', data.atlas_home_phone);
    this.fillDropdownByText('atlas_mobile_phone_country_code', data.atlas_mobile_phone_country_code);
    this.fillField('atlas_mobile_phone', data.atlas_mobile_phone);
    
    // Mailing address
    this.fillField('atlas_mailing_street', data.atlas_mailing_street);
    this.fillField('atlas_mailing_city', data.atlas_mailing_city);
    this.fillField('atlas_mailing_state', data.atlas_mailing_state);
    this.fillField('atlas_mailing_postal_code', data.atlas_mailing_postal_code);
    
    // Passport information
    this.fillField('atlas_passport_number', data.atlas_passport_number);
    this.fillField('atlas_passport_issuance_date_datepicker_description', data.atlas_passport_issuance_date_datepicker_description);
    this.fillField('atlas_passport_place_of_issue', data.atlas_passport_place_of_issue);
    this.fillField('atlas_passport_expiration_date_datepicker_description', data.atlas_passport_expiration_date_datepicker_description);
    
    // IDs
    this.fillField('atlas_national_id', data.atlas_national_id);
  }

  // Fill family details
  fillFamilyDetails(data) {
    if (data.father) {
      this.fillField('father_first_name', data.father.firstName);
      this.fillField('father_last_name', data.father.lastName);
      this.fillDropdownByText('father_nationality', data.father.nationality);
    }
    
    if (data.mother) {
      this.fillField('mother_first_name', data.mother.firstName);
      this.fillField('mother_last_name', data.mother.lastName);
      this.fillDropdownByText('mother_nationality', data.mother.nationality);
    }
    
    if (data.spouse) {
      this.fillField('spouse_first_name', data.spouse.firstName);
      this.fillField('spouse_last_name', data.spouse.lastName);
      this.fillDropdownByText('spouse_nationality', data.spouse.nationality);
    }
  }

  // Fill travel information
  fillTravelInfo(data) {
    this.fillField('purpose_of_trip', data.purposeOfTrip);
    this.fillField('intended_arrival_date', data.arrivalDate);
    this.fillField('intended_departure_date', data.departureDate);
    this.fillField('length_of_stay', data.lengthOfStay);
    
    // Previous US travel
    this.fillRadioByValue('previous_us_travel', data.previousUSTravel ? 'yes' : 'no');
    if (data.previousUSTravel) {
      this.fillField('previous_visa_number', data.previousVisaNumber);
      this.fillField('previous_visa_issue_date', data.previousVisaIssueDate);
    }
  }

  // Fill address information
  fillAddress(data) {
    if (data.homeAddress) {
      this.fillField('address_line_1', data.homeAddress.street1);
      this.fillField('address_line_2', data.homeAddress.street2);
      this.fillField('city', data.homeAddress.city);
      this.fillField('state', data.homeAddress.state);
      this.fillField('postal_code', data.homeAddress.postalCode);
      this.fillDropdownByText('country', data.homeAddress.country);
    }
    
    // US Address
    if (data.usAddress) {
      this.fillField('us_address_line_1', data.usAddress.street1);
      this.fillField('us_address_line_2', data.usAddress.street2);
      this.fillField('us_city', data.usAddress.city);
      this.fillDropdownByText('us_state', data.usAddress.state);
      this.fillField('us_zip_code', data.usAddress.zipCode);
    }
  }

  // Fill passport information
  fillPassport(data) {
    if (data.passport) {
      this.fillField('passport_number', data.passport.number);
      this.fillDropdownByText('passport_country', data.passport.issuingCountry);
      this.fillField('passport_issue_date', data.passport.issueDate);
      this.fillField('passport_expiry_date', data.passport.expiryDate);
      this.fillField('passport_issue_city', data.passport.issueCity);
    }
  }

  // Fill payment page (Ayobas Premium)
  fillPaymentPage(data) {
    // Payment amount - extract from price or use provided amount
    if (data.payment_amount || data.amount) {
      this.fillField('amount', data.payment_amount || data.amount);
    }
    
    // Payment confirmation/receipt number
    if (data.payment_confirmation || data.receipt || data.confirmation_number) {
      this.fillField('receipt', data.payment_confirmation || data.receipt || data.confirmation_number);
    }
    
    // Email fields
    this.fillField('email', data.email || data.atlas_email || data.atlas_emailaddress1);
    this.fillField('reemail', data.email || data.atlas_email || data.atlas_emailaddress1);
    
    // Name fields
    this.fillField('name_first', data.name_first || data.firstname || data.firstName || data.first_name || data.atlas_first_name);
    this.fillField('name_last', data.name_last || data.lastname || data.lastName || data.last_name || data.atlas_last_name);
    
    // Preferred language - this appears to be a dropdown on the payment page
    if (data.adx_preferredlanguageid || data.preferred_language) {
      const language = this.getLanguageMapping(data.adx_preferredlanguageid || data.preferred_language);
      this.fillDropdownByText('adx_preferredlanguageid', language);
    }
    
    // Japanese address fields
    this.fillField('postal_code', data.postal_code || data.zip_code || data.atlas_mailing_postal_code);
    this.fillField('region', data.prefecture || data.region || data.state || data.atlas_mailing_state);
    this.fillField('city', data.city || data.municipality || data.atlas_mailing_city);
    this.fillField('street', data.street || data.address || data.atlas_mailing_street);
    this.fillField('street2', data.apartment || data.street2 || data.room_number);
    
    // Phone number
    if (data.phone || data.atlas_home_phone || data.atlas_mobile_phone) {
      const phone = data.phone || data.atlas_mobile_phone || data.atlas_home_phone;
      this.fillField('phone', phone);
    }
    
    // Check any required checkboxes
    const policyCheckbox = document.getElementById('ckb_policy');
    if (policyCheckbox && data.accept_terms !== false) {
      policyCheckbox.checked = true;
      policyCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    const confirmCheckbox = document.getElementById('chbx_confirm');
    if (confirmCheckbox && data.confirm_details !== false) {
      confirmCheckbox.checked = true;
      confirmCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  // Fill contact information
  fillContactInfo(data) {
    this.fillField('email', data.email);
    this.fillField('phone', data.phone);
    this.fillField('mobile', data.mobile);
    this.fillField('work_phone', data.workPhone);
    
    // Emergency contact
    if (data.emergencyContact) {
      this.fillField('emergency_name', data.emergencyContact.name);
      this.fillField('emergency_phone', data.emergencyContact.phone);
      this.fillField('emergency_email', data.emergencyContact.email);
      this.fillField('emergency_relationship', data.emergencyContact.relationship);
    }
  }

  // Generic field filling - works with atlas_ fields
  fillGenericFields(data) {
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        // Check if it's a dropdown field (by looking for country_code or known dropdowns)
        if (key.includes('country') || key.includes('nationality') || key.includes('country_code')) {
          this.fillDropdownByText(key, value);
        } else {
          this.fillField(key, value);
        }
      }
    });
  }

  // Core filling functions
  fillField(identifier, value) {
    if (!value || this.filledFields.has(identifier)) return;
    
    // Try multiple ways to find the field
    let element = document.getElementById(identifier);
    if (!element) element = document.querySelector(`[name="${identifier}"]`);
    if (!element) element = document.querySelector(`[name*="${identifier}"]`);
    if (!element) element = document.querySelector(`[id*="${identifier}"]`);
    
    if (element && element.offsetParent) {
      if (element.type === 'select-one') {
        this.fillDropdownByText(identifier, value);
      } else if (element.type === 'radio') {
        this.fillRadioByValue(identifier, value);
      } else if (element.type === 'checkbox') {
        element.checked = value === true || value === 'yes' || value === 'Y';
        element.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      this.filledFields.add(identifier);
      console.log(`Filled ${identifier} with ${value}`);
    }
  }

  // Fill dropdown by matching text (not value)
  fillDropdownByText(identifier, text) {
    if (!text || this.filledFields.has(identifier)) return;
    
    let element = document.getElementById(identifier);
    if (!element) element = document.querySelector(`[name="${identifier}"]`);
    if (!element) element = document.querySelector(`[name*="${identifier}"]`);
    if (!element) element = document.querySelector(`[id*="${identifier}"]`);
    
    if (element && element.tagName === 'SELECT') {
      // Find option by text match
      const options = Array.from(element.options);
      let matchedOption = null;
      
      // Try exact match first
      matchedOption = options.find(opt => 
        opt.text.trim().toLowerCase() === text.toLowerCase()
      );
      
      // Try contains match
      if (!matchedOption) {
        matchedOption = options.find(opt => 
          opt.text.toLowerCase().includes(text.toLowerCase())
        );
      }
      
      // Try partial match
      if (!matchedOption) {
        matchedOption = options.find(opt => 
          text.toLowerCase().includes(opt.text.toLowerCase()) ||
          opt.text.toLowerCase().includes(text.split(' ')[0].toLowerCase())
        );
      }
      
      if (matchedOption) {
        element.value = matchedOption.value;
        element.dispatchEvent(new Event('change', { bubbles: true }));
        this.filledFields.add(identifier);
        console.log(`Filled dropdown ${identifier} with ${text} (value: ${matchedOption.value})`);
      } else {
        console.log(`Could not find option "${text}" in dropdown ${identifier}`);
      }
    }
  }

  // Fill radio button by value
  fillRadioByValue(name, value) {
    if (!value || this.filledFields.has(name)) return;
    
    const radios = document.querySelectorAll(`input[type="radio"][name="${name}"], input[type="radio"][name*="${name}"]`);
    
    radios.forEach(radio => {
      if (radio.value === value || 
          radio.value.toLowerCase() === value.toLowerCase() ||
          (value === 'yes' && radio.value === 'Y') ||
          (value === 'no' && radio.value === 'N')) {
        radio.checked = true;
        radio.click();
        radio.dispatchEvent(new Event('change', { bubbles: true }));
        this.filledFields.add(name);
        console.log(`Selected radio ${name} with value ${value}`);
      }
    });
  }

  // Date helper functions
  extractDay(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split(/[-/]/);
    return parts[2] || parts[0];
  }

  extractMonth(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split(/[-/]/);
    return parts[1];
  }

  extractYear(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split(/[-/]/);
    return parts[0].length === 4 ? parts[0] : parts[2];
  }

  // Create floating dependent selector UI
  createDependentSelector() {
    // Remove existing selector if present
    const existing = document.getElementById('visa-dependent-selector');
    if (existing) existing.remove();
    
    if (this.dependents.length === 0) {
      console.log('No dependents found in data');
      return;
    }
    
    // Create selector container
    const selector = document.createElement('div');
    selector.id = 'visa-dependent-selector';
    selector.innerHTML = `
      <div class="vds-header">
        <span class="vds-title">👥 Select Dependent to Fill</span>
        <button class="vds-minimize">_</button>
        <button class="vds-close">✕</button>
      </div>
      <div class="vds-body">
        <div class="vds-list">
          ${this.dependents.map(dep => `
            <div class="vds-item">
              <input type="radio" name="dependent" id="${dep.id}" value="${dep.id}">
              <label for="${dep.id}">${dep.displayName}</label>
            </div>
          `).join('')}
        </div>
        <button class="vds-fill-btn">Fill Selected Dependent</button>
      </div>
    `;
    
    // Add styles
    const styles = `
      #visa-dependent-selector {
        position: fixed;
        top: 100px;
        right: 20px;
        width: 300px;
        background: white;
        border: 2px solid #4CAF50;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 99999;
        font-family: Arial, sans-serif;
      }
      .vds-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 10px;
        border-radius: 6px 6px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .vds-title {
        font-weight: bold;
        font-size: 14px;
      }
      .vds-minimize, .vds-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 16px;
        padding: 0 5px;
      }
      .vds-body {
        padding: 15px;
      }
      .vds-body.hidden {
        display: none;
      }
      .vds-list {
        max-height: 200px;
        overflow-y: auto;
        margin-bottom: 15px;
      }
      .vds-item {
        padding: 8px;
        border-bottom: 1px solid #eee;
      }
      .vds-item:hover {
        background: #f5f5f5;
      }
      .vds-item label {
        margin-left: 8px;
        cursor: pointer;
        font-size: 14px;
      }
      .vds-fill-btn {
        width: 100%;
        padding: 10px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        font-size: 14px;
      }
      .vds-fill-btn:hover {
        background: #45a049;
      }
      .vds-fill-btn:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
    `;
    
    // Add styles to page
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
    
    // Add to page
    document.body.appendChild(selector);
    
    // Add event listeners
    selector.querySelector('.vds-close').addEventListener('click', () => {
      selector.remove();
      this.selectorVisible = false;
    });
    
    selector.querySelector('.vds-minimize').addEventListener('click', () => {
      const body = selector.querySelector('.vds-body');
      body.classList.toggle('hidden');
    });
    
    selector.querySelector('.vds-fill-btn').addEventListener('click', () => {
      this.fillSelectedDependent();
    });
    
    this.selectorVisible = true;
    console.log('Dependent selector created');
  }
  
  // Fill form with dependent data from popup
  fillDependentData(dependent) {
    if (!dependent) {
      console.error('No dependent data provided');
      return;
    }
    
    console.log('Filling form with dependent:', dependent.displayName || `${dependent.firstname} ${dependent.lastname}`);
    
    // Determine which page we're on and fill accordingly
    const url = window.location.href;
    const title = document.title;
    
    if (url.includes('daddcontact') || title.includes('Dependent Contact') || title.includes('Contact Information')) {
      this.fillDependentContactPage(dependent);
    } else if (url.includes('dep_applicant_add') || url.includes('dependent') || title.includes('Dependent Applicant') || title.includes('Dependent')) {
      this.fillDependentApplicantPage(dependent);
    } else {
      // Try to fill any matching fields generically
      console.log('Not on a specific dependent page, attempting generic fill');
      this.fillGenericDependentFields(dependent);
    }
  }
  
  // Generic fill for dependent fields
  fillGenericDependentFields(dependent) {
    // Try all possible field names
    const fieldMappings = {
      'firstname': dependent.firstname,
      'lastname': dependent.lastname,
      'atlas_first_name': dependent.atlas_first_name,
      'atlas_last_name': dependent.atlas_last_name,
      'atlas_emailaddress1': dependent.atlas_emailaddress1,
      'atlas_email': dependent.atlas_email,
      'atlas_relation_to_applicant': dependent.atlas_relation_to_applicant,
      'atlas_pob_country': dependent.atlas_pob_country,
      'atlas_birthdate_datepicker_description': dependent.atlas_birthdate_datepicker_description,
      'atlas_nationality': dependent.atlas_nationality,
      'atlas_passport_number': dependent.atlas_passport_number,
      'atlas_passport_issuance_date_datepicker_description': dependent.atlas_passport_issuance_date_datepicker_description,
      'atlas_passport_expiration_date_datepicker_description': dependent.atlas_passport_expiration_date_datepicker_description,
      'atlas_passport_place_of_issue': dependent.atlas_passport_place_of_issue,
      'atlas_home_phone_country_code': dependent.atlas_home_phone_country_code,
      'atlas_home_phone': dependent.atlas_home_phone,
      'atlas_mobile_phone_country_code': dependent.atlas_mobile_phone_country_code,
      'atlas_mobile_phone': dependent.atlas_mobile_phone,
      'atlas_mailing_street': dependent.atlas_mailing_street,
      'atlas_mailing_city': dependent.atlas_mailing_city,
      'atlas_mailing_state': dependent.atlas_mailing_state,
      'atlas_mailing_postal_code': dependent.atlas_mailing_postal_code,
      'atlas_national_id': dependent.atlas_national_id,
      'adx_preferredlanguageid': dependent.adx_preferredlanguageid
    };
    
    Object.entries(fieldMappings).forEach(([fieldName, value]) => {
      if (value) {
        if (fieldName.includes('country') || fieldName.includes('nationality') || fieldName.includes('country_code') || fieldName.includes('preferredlanguageid') || fieldName.includes('relation')) {
          this.fillDropdownByText(fieldName, value);
        } else {
          this.fillField(fieldName, value);
        }
      }
    });
    
    this.showNotification('Form filled with dependent data!');
  }
  
  // Language mapping for preferred language dropdown
  getLanguageMapping(language) {
    const languageMap = {
      'Japanese': '日本語',
      'English': 'English',
      'Chinese': '中文(中国)',
      'Chinese (Taiwan)': '中文(台灣)',
      'Korean': '한국어',
      'Spanish': 'español',
      'French': 'français',
      'German': 'Deutsch',
      'Russian': 'русский',
      'Arabic': 'العربية',
      'Thai': 'ไทย',
      'Vietnamese': 'Tiếng Việt',
      'Turkish': 'Türkçe',
      'Portuguese': 'português',
      'Italian': 'italiano',
      'Hindi': 'हिंदी',
      'Indonesian': 'Bahasa Indonesia',
      'Malay': 'Bahasa Melayu',
      'Filipino': 'Filipino',
      'Urdu': 'Urdu',
      'Tamil': 'Tamil'
    };
    
    // Return mapped language or original if not in map
    return languageMap[language] || language;
  }
  
  // Fill the contact information page
  fillDependentContactPage(dependent) {
    console.log('Filling Dependent Contact page');
    
    this.fillField('firstname', dependent.firstname);
    this.fillField('lastname', dependent.lastname);
    this.fillField('atlas_emailaddress1', dependent.atlas_emailaddress1);
    
    // Map language to native script before filling
    const language = this.getLanguageMapping(dependent.adx_preferredlanguageid) || 'English';
    this.fillDropdownByText('adx_preferredlanguageid', language);
    
    // Show success message
    this.showNotification('Contact information filled successfully!');
  }
  
  // Fill the dependent applicant page
  fillDependentApplicantPage(dependent) {
    console.log('Filling Dependent Applicant page');
    
    // Basic information
    this.fillDropdownByText('atlas_relation_to_applicant', dependent.atlas_relation_to_applicant);
    this.fillField('atlas_first_name', dependent.atlas_first_name);
    this.fillField('atlas_last_name', dependent.atlas_last_name);
    
    // Birth information
    this.fillDropdownByText('atlas_pob_country', dependent.atlas_pob_country);
    this.fillField('atlas_birthdate_datepicker_description', dependent.atlas_birthdate_datepicker_description);
    this.fillDropdownByText('atlas_nationality', dependent.atlas_nationality);
    
    // Passport information
    this.fillField('atlas_passport_number', dependent.atlas_passport_number);
    this.fillField('atlas_passport_issuance_date_datepicker_description', dependent.atlas_passport_issuance_date_datepicker_description);
    this.fillField('atlas_passport_expiration_date_datepicker_description', dependent.atlas_passport_expiration_date_datepicker_description);
    this.fillField('atlas_passport_place_of_issue', dependent.atlas_passport_place_of_issue);
    
    // Contact information
    this.fillDropdownByText('atlas_home_phone_country_code', dependent.atlas_home_phone_country_code);
    this.fillField('atlas_home_phone', dependent.atlas_home_phone);
    this.fillDropdownByText('atlas_mobile_phone_country_code', dependent.atlas_mobile_phone_country_code);
    this.fillField('atlas_mobile_phone', dependent.atlas_mobile_phone);
    this.fillField('atlas_email', dependent.atlas_email);
    
    // Address
    this.fillField('atlas_mailing_street', dependent.atlas_mailing_street);
    this.fillField('atlas_mailing_city', dependent.atlas_mailing_city);
    this.fillField('atlas_mailing_state', dependent.atlas_mailing_state);
    this.fillField('atlas_mailing_postal_code', dependent.atlas_mailing_postal_code);
    
    // National ID
    this.fillField('atlas_national_id', dependent.atlas_national_id);
    
    // Show success message
    this.showNotification('Dependent applicant information filled successfully!');
  }
  
  // Show notification
  showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #4CAF50;
      color: white;
      padding: 15px 25px;
      border-radius: 5px;
      font-size: 14px;
      z-index: 100000;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize the filler
const visaFiller = new VisaSchedulingFiller();

// Add indicator that extension is active
const indicator = document.createElement('div');
indicator.innerHTML = '✓ Visa Filler v1.0.9 Active';
indicator.style.cssText = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #4CAF50;
  color: white;
  padding: 10px 15px;
  border-radius: 5px;
  font-size: 14px;
  z-index: 10000;
  opacity: 0.9;
`;
document.body.appendChild(indicator);

// Hide indicator after 3 seconds
setTimeout(() => {
  indicator.style.display = 'none';
}, 3000);