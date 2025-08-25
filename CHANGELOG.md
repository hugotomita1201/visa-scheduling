# Changelog

## Version 1.1.2 (Current)
- Fixed email field differentiation between signup and contact information
- Contact information email fields (atlas_email, atlas_emailaddress1) now properly auto-fill for all applicants
- Signup/account creation email fields (email, reemail) are intentionally left blank for manual entry
- Emergency contact emails now fill correctly when data is provided
- Improved dependent email handling - each dependent's email is properly filled in their forms
- Added comprehensive documentation about email field handling

## Version 1.1.1
- Improved UI with more rounded corners for modern appearance
- Updated all UI elements with consistent border-radius
- Cards now have 16px rounded corners
- Better visual consistency throughout the extension

## Version 1.1.0
- Fixed extension state being lost when navigating between pages
- Extension now remembers selected person and active tab
- Automatically shows person selector when reopening popup if data is loaded
- No longer resets to "Load Data" screen after page navigation
- Better state persistence using Chrome storage API
- Smoother user experience during multi-page form filling

## Version 1.0.9
- Fixed language dropdown not filling due to native script options
- Added language mapping for common languages (Japanese → 日本語, etc.)
- Auto-converts English language names to native scripts
- Updated sample data to use correct native script for Japanese
- Now properly fills preferred language field on dependent contact page

## Version 1.0.8
- Fixed preferred language field not filling on payment page
- Added support for adx_preferredlanguageid dropdown field
- Improved field name matching for firstname/lastname variants
- Better email field fallback (includes atlas_emailaddress1)

## Version 1.0.7
- Added support for Ayobas Premium payment page
- Auto-detects payment pages and fills payment-specific fields
- Supports payment amount and confirmation number fields
- Handles Japanese address format (prefecture, municipality, postal code)
- Auto-fills email confirmation fields
- Added payment data to sample JSON

## Version 1.0.6
- Unified person selection on main Fill Form tab
- Removed separate Dependent Fill tab
- Combined applicant and dependents into single selection list
- Auto-switches to Fill Form tab after loading data
- Added Edit Data button to go back to JSON input
- Visual distinction for main applicant (green border)
- Improved field count display
- Better UX with everything in one place

## Version 1.0.5
- Redesigned Dependent Fill tab with integrated radio button selection
- Replaced floating selector with direct fill from popup
- Added persistent selection across popup reopening
- Improved UX - select dependent and click Auto-Fill
- Generic field filling for any page with matching fields
- Data persists across page refreshes via chrome.storage.local

## Version 1.0.4
- Replaced Help tab with Dependent Fill tab
- Added manual trigger for dependent selector via popup button
- Removed auto-detection of dependent pages (now manual only)
- Improved dependent list display in popup
- Added button to manually show dependent selector on any page

## Version 1.0.3
- Added dependent management feature
- Floating dependent selector UI on dependent pages
- Support for multiple dependents (spouse, children, parents)
- Auto-fill for Dependent Contact and Dependent Applicant pages
- Improved popup UI to show loaded dependents
- Save dependent data to local storage for content script access
- Visual indicators for dependent-related features

## Version 1.0.2
- Fixed syntax errors in content script
- Improved field detection and filling logic

## Version 1.0.1
- Fixed content script injection issue
- Added dynamic script injection when filling forms
- Improved message passing between popup and content script
- Added support for atlas_ field format
- Fixed dropdown detection for fields with country/nationality
- Better error handling and console logging

## Version 1.0.0
- Initial release
- Basic form filling functionality
- Support for US Visa Scheduling sites
- JSON data input
- Field detection feature
