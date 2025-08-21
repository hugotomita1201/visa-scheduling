# US Visa Scheduling Auto-Filler Chrome Extension

A Chrome extension that automatically fills US Visa Scheduling forms on usvisascheduling.com and ais.usvisa-info.com

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the `usvisascheduling-extension` folder
5. The extension icon will appear in your Chrome toolbar

## How to Use

### Step 1: Prepare Your Data
Create a JSON object with your information. The extension supports both simple format and the new atlas_ field format with dependents:

**Option 1: Atlas Field Format (Recommended for Dependent Management)**
```json
{
  "applicant": {
    "atlas_first_name": "Hugo",
    "atlas_last_name": "Tomita",
    "atlas_email": "tomitahugo@gmail.com",
    "atlas_birthdate_datepicker_description": "12/8/2003",
    "atlas_passport_number": "235352398574224"
  },
  "dependents": [
    {
      "id": "dep_1",
      "displayName": "Yuki Tomita (Spouse)",
      "atlas_relation_to_applicant": "Spouse",
      "atlas_first_name": "Yuki",
      "atlas_last_name": "Tomita",
      "atlas_email": "yuki.tomita@gmail.com"
    }
  ]
}
```

**Option 2: Simple Format**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "dateOfBirth": "1990-03-15",
  "email": "john.smith@email.com"
}
```

### Step 2: Load Your Data
1. Click the extension icon in Chrome toolbar
2. Paste your JSON data into the text area
3. Click "Load Data" to validate and save

### Step 3: Fill Forms

**For Main Applicant:**
1. Navigate to the US Visa Scheduling website
2. Go to the page you want to fill (Applicant Details, Address, etc.)
3. Click the extension icon
4. Click "🚀 Auto-Fill This Page"

**For Dependents:**
1. Navigate to the Manage Dependents page
2. A floating selector will appear automatically showing all loaded dependents
3. Select the dependent you want to fill
4. Click "Fill Selected Dependent"
5. The form will be automatically populated with that dependent's information

## Features

- **Smart Field Detection**: Automatically detects form fields on the current page
- **Text-Based Dropdown Matching**: Matches dropdown options by text, not internal IDs
- **Multi-Page Support**: Works across different pages of the visa application
- **Data Persistence**: Saves your data for reuse across sessions
- **Field Detection Tool**: See what fields are available on the current page
- **👥 Dependent Management**: Automatic filling for multiple dependents with floating selector UI

## Supported Fields

### Personal Information
- First Name, Last Name, Middle Name
- Date of Birth
- Country of Birth, Nationality
- Gender, Marital Status
- National ID, SSN, Tax ID

### Passport Information
- Passport Number
- Issuing Country
- Issue Date, Expiry Date

### Address Information
- Home Address (Street, City, State, Country, Postal Code)
- US Address (Street, City, State, ZIP Code)

### Contact Information
- Email
- Phone Numbers (Home, Mobile, Work)
- Emergency Contact

### Family Information
- Father's Details
- Mother's Details
- Spouse's Details

### Travel Information
- Purpose of Trip
- Arrival/Departure Dates
- Previous US Travel History

## Tips

- **Use Ctrl+E (or Cmd+E on Mac)** in the popup to load example data for testing
- **Detect Fields** tab shows all fields available on the current page
- Dropdowns are filled by matching text (e.g., "United States" not GUID values)
- The extension shows a green indicator when active on supported sites

## Troubleshooting

1. **Fields not filling?**
   - Make sure you're on a supported site
   - Check that your JSON data matches the field names
   - Try the "Detect Fields" feature to see available fields

2. **Dropdown not selecting?**
   - The extension matches by text, ensure country/state names match exactly
   - Try partial matches (e.g., "United" for "United States")

3. **Data not saving?**
   - Click "Load Data" after pasting JSON
   - Check for JSON syntax errors

## Supported Websites

- https://www.usvisascheduling.com/*
- https://ais.usvisa-info.com/*

## Privacy

This extension:
- Only runs on visa scheduling websites
- Stores data locally in your browser
- Does not send data to external servers
- Does not track or collect user information

## Development

To modify the extension:
1. Edit the files in this folder
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

## Files Structure

- `manifest.json` - Extension configuration
- `content.js` - Form filling logic
- `background.js` - Data management
- `popup.html/js` - User interface
- `icon*.png` - Extension icons

## Dependent Management Feature

The extension includes advanced dependent management capabilities:

### How It Works
1. Load your JSON data with applicant and dependents structure
2. Navigate to dependent pages (Dependent Contact or Dependent Applicant)
3. A floating selector UI will automatically appear
4. Select the dependent you want to fill from the list
5. Click "Fill Selected Dependent" to auto-populate all fields

### Supported Dependent Pages
- **Dependent Contact Page** (`/daddcontact/`)
  - First Name, Last Name
  - Contact Email
  - Preferred Language
  
- **Dependent Applicant Page** (`/dep_applicant_add/`)
  - Relationship to Applicant
  - Personal Information (Name, DOB, Nationality)
  - Passport Details
  - Contact Information
  - Mailing Address
  - National ID

### Benefits
- Eliminates repetitive data entry for multiple dependents
- Quick switching between dependents
- Visual selector for easy dependent identification
- Automatic page detection

## Version

1.0.3 - Added dependent management feature
1.0.2 - Fixed syntax errors
1.0.1 - Fixed content script injection
1.0.0 - Initial release