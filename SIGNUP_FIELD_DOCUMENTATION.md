# US Visa Scheduling System - Field Documentation
## Comprehensive Field Handling Guide for Chrome Extension

---

## 📋 Overview
This document provides a comprehensive explanation of how different types of fields are handled by the US Visa Scheduling Chrome extension, with special emphasis on the distinction between signup/account creation fields and contact information fields.

---

## 🔑 Field Categories and Handling

### Category 1: Signup/Account Creation Fields (Manual Entry Required)

These fields are intentionally left empty for users to fill manually:

#### 1. **Email Address (email)**
**Field ID:** `email`  
**Value:** LEFT EMPTY - User will enter manually  
**Purpose:** Account creation email address  
**Note:** This is different from contact information email fields  

#### 2. **Re-enter Email (reemail)**
**Field ID:** `reemail`  
**Value:** LEFT EMPTY - User will re-enter their email  
**Purpose:** Email confirmation for account creation  

#### 3. **New Password (newPassword)**
**Field ID:** `newPassword`  
**Value:** LEFT EMPTY - User will create their own password  
**Requirements:**
- User must create a password meeting system requirements
- Typically needs uppercase, lowercase, numbers, and special characters

#### 4. **Confirm Password (reenterPassword)**
**Field ID:** `reenterPassword`  
**Value:** LEFT EMPTY - User will re-enter their chosen password  
**Purpose:** Password confirmation field

---

### Category 2: Contact Information Fields (Auto-Filled)

These fields are automatically filled with the provided data:

#### 1. **Contact Email (atlas_email)**
**Field ID:** `atlas_email`  
**Value:** Automatically filled from JSON data  
**Used In:** 
- Main applicant contact information pages
- Dependent contact information pages
- Emergency contact sections
**Example:** `tomitahugo@gmail.com`

#### 2. **Contact Email Address (atlas_emailaddress1)**
**Field ID:** `atlas_emailaddress1`  
**Value:** Automatically filled from JSON data  
**Purpose:** Alternative contact email field used in some forms  
**Note:** Falls back to `atlas_email` if not specifically provided

#### 3. **Emergency Contact Email**
**Field Path:** `emergencyContact.email`  
**Value:** Automatically filled when emergency contact data is provided  
**Example:** `emergency.contact@example.com`

---

### Category 3: Name Fields (Auto-Filled)

#### 1. **Username (signInName)**
**Field ID:** `signInName`  
**Derivation Pattern:** `[full_firstname][full_lastname]`  
**Case:** All lowercase  
**Source:** Main applicant's name ONLY  
**Examples:**
- Takeshi Yamamoto → `takeshiyamamoto`
- John Smith → `johnsmith`

#### 2. **Given Name (givenName)**
**Field ID:** `givenName`  
**Source:** Main applicant's first name  
**Data Sources (priority order):**
1. `atlas_first_name`
2. `firstname`
3. `givenName`

#### 3. **Surname (surname)**
**Field ID:** `surname`  
**Source:** Main applicant's last name  
**Data Sources (priority order):**
1. `atlas_last_name`
2. `lastname`
3. `surname`

---

## 📊 Email Field Decision Flow

```
Email Field Encountered
         ↓
    Is it 'email' or 'reemail'?
         /              \
       Yes               No
        ↓                ↓
   SKIP FIELD      Is it 'atlas_email' or
   (Manual Entry)   'atlas_emailaddress1'?
                         ↓
                        Yes
                         ↓
                    AUTO-FILL
                   (From JSON Data)
```

---

## 🎯 Implementation Rules for Email Fields

### Priority Rules:
1. **Signup fields (email, reemail)**: ALWAYS skip for manual entry
2. **Contact fields (atlas_email, atlas_emailaddress1)**: ALWAYS auto-fill when data exists
3. **Emergency contact email**: AUTO-FILL when provided in data
4. **Dependent emails**: Each dependent's email is filled in their respective forms

### Field Validation:
- Signup emails must be unique per account
- Contact emails can be shared across family members
- Emergency contact email should be different from applicant email

---

## 💡 Example Scenarios

### Scenario 1: Main Applicant Page
**Page Type:** Contact Information  
**Fields Present:**
- `atlas_email` → AUTO-FILLED with "hugo.tomita@example.com"
- `atlas_mobile_phone` → AUTO-FILLED with phone number

### Scenario 2: Signup/Registration Page
**Page Type:** Account Creation  
**Fields Present:**
- `email` → LEFT EMPTY for manual entry
- `reemail` → LEFT EMPTY for manual entry
- `newPassword` → LEFT EMPTY for manual entry

### Scenario 3: Dependent Contact Page
**Page Type:** Dependent Information  
**Selected Dependent:** Yuki (Spouse)  
**Fields Present:**
- `atlas_first_name` → AUTO-FILLED with "Yuki"
- `atlas_email` → AUTO-FILLED with "yuki.tomita@example.com"

### Scenario 4: Emergency Contact Section
**Page Type:** Emergency Information  
**Fields Present:**
- `emergency_name` → AUTO-FILLED with emergency contact name
- `emergency_email` → AUTO-FILLED with emergency contact email
- `emergency_phone` → AUTO-FILLED with emergency contact phone

---

## 🔐 Security Questions Section

Security questions remain consistent across all account types:

### Security Question 1
**Field ID:** `extension_kbq1`  
**Selected:** `"What is your mother's maiden name?"`  
**Answer:** `Tomita`

### Security Question 2
**Field ID:** `extension_kbq2`  
**Selected:** `"What is the name of the road/street you grew up on?"`  
**Answer:** `Law`

### Security Question 3
**Field ID:** `extension_kbq3`  
**Selected:** `"Where did you meet your spouse?"`  
**Answer:** `Office`

---

## 🚨 Important Notes

1. **Email Field Differentiation**: The extension now properly distinguishes between:
   - Signup/account emails (manual entry required)
   - Contact information emails (auto-filled)
   - Emergency contact emails (auto-filled when provided)

2. **Dependent Email Handling**: Each dependent's email is properly filled in their respective forms using the `atlas_email` or `atlas_emailaddress1` fields

3. **No Override**: Users cannot accidentally auto-fill signup email fields - the extension actively skips these

4. **Data Structure**: Ensure your JSON includes separate email fields:
   ```json
   {
     "applicant": {
       "atlas_email": "contact@example.com"  // For contact info
     },
     "dependents": [{
       "atlas_email": "dependent@example.com"  // For dependent contact
     }]
   }
   ```

---

## 📝 Testing Checklist

### Signup Page Testing
- [ ] Email field remains empty
- [ ] Re-enter email field remains empty
- [ ] Password fields remain empty
- [ ] Username generates correctly from name
- [ ] Security questions and answers fill correctly

### Contact Information Testing
- [ ] atlas_email fills with applicant's email
- [ ] atlas_emailaddress1 fills when present
- [ ] Phone numbers fill correctly
- [ ] Emergency contact email fills when provided

### Dependent Testing
- [ ] Each dependent's email fills correctly
- [ ] Dependent selector shows proper names
- [ ] Contact information matches selected dependent
- [ ] No cross-contamination between dependents

---

## 📞 Support Information

**System Version:** 1.1.2  
**Last Updated:** August 2024  
**Key Update:** Proper email field differentiation implemented  
**Maintained By:** Tomita Law Office  

---

*This documentation reflects the current implementation where signup emails are for manual entry while contact emails are auto-filled.*
