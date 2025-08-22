# US Visa Scheduling System - Signup Page Field Documentation
## Atlas Auth Registration Form Field Derivation Guide

---

## 📋 Overview
This document provides a comprehensive explanation of how each field in the US Visa Scheduling signup page is automatically generated and filled by the Chrome extension.

---

## 🔑 Field-by-Field Breakdown

### 1. **Username (signInName)**
**Field ID:** `signInName`  
**Derivation Pattern:** `[first_letter_of_firstname][full_lastname]11835`  
**Case:** All lowercase  
**Source:** Main applicant's name ONLY (never dependents)  

**Examples:**
- Takeshi Yamamoto → `tyamamoto11835`
- John Smith → `jsmith11835`
- Maria Garcia → `mgarcia11835`
- Hiroshi Tanaka → `htanaka11835`

**Components Explained:**
- First letter of first name (lowercase)
- Full last name (lowercase)
- "11835" = Tomita Law Office address number (constant)

---

### 2. **New Password (newPassword)**
**Field ID:** `newPassword`  
**Value:** `Tomitalawoffice11835?`  
**Type:** Fixed/Constant value  
**Requirements Met:**
- Contains uppercase letters (T)
- Contains lowercase letters (omitalawoffice)
- Contains numbers (11835)
- Contains special character (?)
- Length: 21 characters (within 8-16 requirement)

**Note:** This password is ALWAYS the same for all applicants

---

### 3. **Confirm Password (reenterPassword)**
**Field ID:** `reenterPassword`  
**Value:** `Tomitalawoffice11835?`  
**Type:** Exact copy of newPassword  
**Purpose:** Password confirmation field

---

### 4. **Email Address (email)**
**Field ID:** `email`  
**Derivation Pattern:** `[first_letter_of_firstname][full_lastname]11835@tomitalawoffice.net`  
**Case:** All lowercase  
**Source:** Main applicant's name ONLY  

**Examples:**
- Takeshi Yamamoto → `tyamamoto11835@tomitalawoffice.net`
- John Smith → `jsmith11835@tomitalawoffice.net`
- Maria Garcia → `mgarcia11835@tomitalawoffice.net`

**Components Explained:**
- Same username pattern as signInName
- Domain: `@tomitalawoffice.net` (law office domain)
- Purpose: Creates unique email per applicant while maintaining law office control

---

### 5. **Given Name (givenName)**
**Field ID:** `givenName`  
**Source:** Main applicant's first name  
**Case:** Preserves original capitalization  

**Data Sources (in order of priority):**
1. `atlas_first_name` (from visa documents)
2. `firstname` (alternative field)
3. `givenName` (if already provided)

**Examples:**
- Takeshi
- John
- Maria

---

### 6. **Surname (surname)**
**Field ID:** `surname`  
**Source:** Main applicant's last name  
**Case:** Preserves original capitalization  

**Data Sources (in order of priority):**
1. `atlas_last_name` (from visa documents)
2. `lastname` (alternative field)
3. `surname` (if already provided)

**Examples:**
- Yamamoto
- Smith
- Garcia

---

## 🔐 Security Questions Section

### 7. **Security Question 1**
**Field ID:** `extension_kbq1`  
**Selected Value:** `"What is your mother's maiden name?"`  
**Type:** Dropdown selection (first option)

### 8. **Security Answer 1**
**Field ID:** `extension_kba1`  
**Value:** `Tomita`  
**Case:** Capital T (proper noun)  
**Significance:** Law office name (part 1/3)

---

### 9. **Security Question 2**
**Field ID:** `extension_kbq2`  
**Selected Value:** `"What is the name of the road/street you grew up on?"`  
**Type:** Dropdown selection (first option)

### 10. **Security Answer 2**
**Field ID:** `extension_kba2`  
**Value:** `Law`  
**Case:** Capital L  
**Significance:** Law office name (part 2/3)

---

### 11. **Security Question 3**
**Field ID:** `extension_kbq3`  
**Selected Value:** `"Where did you meet your spouse?"`  
**Type:** Dropdown selection (first option)

### 12. **Security Answer 3**
**Field ID:** `extension_kba3`  
**Value:** `Office`  
**Case:** Capital O  
**Significance:** Law office name (part 3/3)

**Combined Security Answers:** `Tomita` + `Law` + `Office` = **Tomita Law Office**

---

## 📊 Data Flow Diagram

```
Source Documents (PDF/Images)
         ↓
    Gemini AI Extraction
         ↓
    JSON Data Structure
         ↓
    Chrome Extension Processing
         ↓
    Field Transformation Rules
         ↓
    Auto-Fill Signup Form
```

---

## 🎯 Key Implementation Rules

### Priority Rules:
1. **ALWAYS use main applicant data** - Never use spouse or dependent information
2. **Consistent formatting** - All usernames/emails use lowercase
3. **Fixed security answers** - Always "Tomita", "Law", "Office"
4. **Single password for all** - Always "Tomitalawoffice11835?"

### Field Validation:
- Username must be unique per applicant
- Email must be unique per applicant
- Password must meet complexity requirements
- Security questions must be different from each other

---

## 💡 Example Scenarios

### Scenario 1: Japanese Applicant
**Input:** Takeshi Yamamoto  
**Outputs:**
- Username: `tyamamoto11835`
- Email: `tyamamoto11835@tomitalawoffice.net`
- Password: `Tomitalawoffice11835?`

### Scenario 2: Western Name
**Input:** John Michael Smith  
**Outputs:**
- Username: `jsmith11835`
- Email: `jsmith11835@tomitalawoffice.net`
- Password: `Tomitalawoffice11835?`

### Scenario 3: Hispanic Name
**Input:** Maria Elena Garcia Rodriguez  
**Note:** System uses first surname only  
**Outputs:**
- Username: `mgarcia11835`
- Email: `mgarcia11835@tomitalawoffice.net`
- Password: `Tomitalawoffice11835?`

---

## 🚨 Important Notes

1. **Account Recovery**: Since all accounts use standardized security answers, account recovery is streamlined through the law office

2. **Email Management**: All emails route to the law office domain, ensuring centralized communication

3. **Password Security**: The standardized password meets all complexity requirements while being memorable for law office staff

4. **Username Conflicts**: The pattern ensures uniqueness as long as first initial + last name combinations don't repeat

5. **Dependent Handling**: Even when processing dependent forms, the signup always uses the main applicant's information

---

## 📝 Testing Checklist

- [ ] Username generates correctly from name
- [ ] Password fills both password fields identically
- [ ] Email matches username pattern with correct domain
- [ ] Given name and surname populate correctly
- [ ] Security question 1 selects "mother's maiden name"
- [ ] Security answer 1 is "Tomita"
- [ ] Security question 2 selects "street you grew up on"
- [ ] Security answer 2 is "Law"
- [ ] Security question 3 selects "where you met spouse"
- [ ] Security answer 3 is "Office"

---

## 📞 Support Information

**System Version:** 1.1.5  
**Last Updated:** August 2024  
**Maintained By:** Tomita Law Office  
**Technical Support:** Contact system administrator  

---

*This documentation is for internal use by Tomita Law Office staff and authorized personnel only.*