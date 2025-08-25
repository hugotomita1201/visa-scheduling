# Email Field Implementation Guide

## Technical Documentation for Email Field Handling

### Overview
This document provides technical details about how the Chrome extension handles different types of email fields in the US Visa Scheduling system. The implementation distinguishes between signup/account creation email fields and contact information email fields.

## Field Types and Identifiers

### 1. Signup/Account Email Fields (Skipped)
These fields are intentionally skipped and left for manual user entry:

| Field ID | Purpose | Location |
|----------|---------|----------|
| `email` | Primary account email | Signup/registration pages |
| `reemail` | Email confirmation | Signup/registration pages |

### 2. Contact Information Email Fields (Auto-filled)
These fields are automatically filled with provided data:

| Field ID | Purpose | Location |
|----------|---------|----------|
| `atlas_email` | Primary contact email | Contact info pages, dependent forms |
| `atlas_emailaddress1` | Alternative contact email | Some contact forms |
| `emergency_email` | Emergency contact email | Emergency contact section |

## Implementation Code Structure

### Content Script (content.js)

#### Email Field Detection Logic
```javascript
// In fillAllFields method
Object.keys(data).forEach(key => {
  // Skip signup email fields only
  if (key === 'email' || key === 'reemail') {
    console.log(`Skipping ${key} - signup email field, user enters manually`);
    return;
  }
  
  // Process all other fields including atlas_email
  this.fillField(key, data[key]);
});
```

#### Contact Information Filling
```javascript
fillContactInfo(data) {
  // Contact email fields are filled
  this.fillField('atlas_email', data.atlas_email);
  this.fillField('atlas_emailaddress1', data.atlas_emailaddress1);
  
  // Emergency contact email
  if (data.emergencyContact) {
    this.fillField('emergency_email', data.emergencyContact.email);
  }
}
```

#### Dependent Email Handling
```javascript
fillDependentFields(dependent) {
  // Each dependent has their own email
  this.fillField('atlas_email', dependent.atlas_email);
  this.fillField('atlas_emailaddress1', dependent.atlas_emailaddress1);
}
```

## Data Structure Requirements

### JSON Data Format
```json
{
  "applicant": {
    "atlas_first_name": "John",
    "atlas_last_name": "Doe",
    "atlas_email": "john.doe@example.com",  // Contact email (auto-filled)
    "atlas_emailaddress1": "john.doe@backup.com"  // Alternative contact (auto-filled)
  },
  "dependents": [
    {
      "id": "dep_1",
      "atlas_first_name": "Jane",
      "atlas_last_name": "Doe",
      "atlas_email": "jane.doe@example.com"  // Dependent's contact email
    }
  ],
  "emergencyContact": {
    "name": "Emergency Person",
    "email": "emergency@example.com",  // Emergency contact email
    "phone": "555-0123"
  }
}
```

## Page-Specific Behavior

### 1. Signup/Registration Pages
- URL Pattern: `/signup`, `/register`, `/auth`
- Behavior: `email` and `reemail` fields are skipped
- User Action: Manual entry required

### 2. Contact Information Pages
- URL Pattern: `/contact`, `/applicant-info`
- Behavior: `atlas_email` fields are auto-filled
- User Action: Review and modify if needed

### 3. Dependent Pages
- URL Pattern: `/dep_applicant_add`, `/daddcontact`
- Behavior: Selected dependent's email is filled
- User Action: Select dependent from UI

### 4. Payment Pages
- URL Pattern: `/payment`, `/ayobas`
- Behavior: Payment receipt email can be different
- User Action: Manual entry if different from contact

## Error Handling

### Missing Email Data
```javascript
if (!data.atlas_email && !data.atlas_emailaddress1) {
  console.log('No contact email provided in data');
  // Field remains empty but doesn't block other fields
}
```

### Field Not Found
```javascript
const field = document.querySelector(`[name="${fieldName}"]`);
if (!field) {
  console.log(`Field ${fieldName} not found on page`);
  return;
}
```

## Testing Scenarios

### Test Case 1: Signup Page
1. Navigate to signup page
2. Load data with email fields
3. Verify `email` field remains empty
4. Verify `atlas_email` not present on page

### Test Case 2: Contact Information
1. Navigate to contact info page
2. Load applicant data
3. Verify `atlas_email` fills correctly
4. Verify phone numbers also fill

### Test Case 3: Dependent Selection
1. Navigate to dependent page
2. Select specific dependent
3. Verify correct dependent email fills
4. Verify no cross-contamination

### Test Case 4: Emergency Contact
1. Navigate to emergency contact section
2. Load data with emergency contact
3. Verify emergency email fills
4. Verify it's different from main email

## Browser Console Commands for Debugging

```javascript
// Check if email fields exist on current page
document.querySelectorAll('[name*="email"]').forEach(f => console.log(f.name));

// Check current field values
console.log('email:', document.querySelector('[name="email"]')?.value);
console.log('atlas_email:', document.querySelector('[name="atlas_email"]')?.value);

// Manually trigger fill for testing
chrome.runtime.sendMessage({action: 'fillFields'});
```

## Version Compatibility

| Extension Version | Email Handling |
|------------------|----------------|
| 1.0.0 - 1.1.1 | All email fields auto-filled |
| 1.1.2+ | Signup emails skipped, contact emails filled |

## Migration Notes

For users upgrading from versions before 1.1.2:
1. Signup email fields will no longer auto-fill
2. Users must manually enter their preferred account email
3. Contact emails continue to auto-fill as before
4. No changes needed to JSON data structure

## Common Issues and Solutions

### Issue 1: Email not filling on contact page
**Solution:** Ensure field name is `atlas_email` not `email`

### Issue 2: Dependent email wrong
**Solution:** Verify correct dependent is selected in UI

### Issue 3: Signup email filling unexpectedly
**Solution:** Update to version 1.1.2 or later

## Future Enhancements

Potential improvements for future versions:
1. Optional flag to enable signup email auto-fill
2. Email validation before filling
3. Support for multiple email addresses per person
4. Email format preferences (work vs personal)

---

Last Updated: August 2024
Version: 1.1.2
