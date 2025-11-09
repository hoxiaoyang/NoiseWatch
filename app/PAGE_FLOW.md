# NoiseWatch - Page Flow Documentation

This document describes the multi-page flow of the NoiseWatch application.

## Page Structure

The application is now structured as a **3-page flow** with clear separation of concerns:

### 1. **Home Page** (`/`)
**File:** `app/page.tsx`

**Purpose:** Report submission form

**Features:**
- Complaint form with validation
  - Block number input
  - Unit number input (format: ##-###)
  - Start/End time selectors
  - Description textarea
- Hero section with trust messaging
- Info cards explaining features
- Real-time form validation

**Navigation:**
- **Next:** After successful form submission → `/matching-results`

**State Management:**
- Stores complaint data in `sessionStorage` before navigation

---

### 2. **Matching Results Page** (`/matching-results`)
**File:** `app/matching-results/page.tsx`

**Purpose:** Display and select matching noise records

**Features:**
- Progress indicator (Step 2 of 3)
- Complaint summary card showing user's submitted data
- Loading state with spinner (2-second simulation)
- List of matching noise records with:
  - Location (offending block/unit)
  - Timestamp
  - Confidence score badges
  - Description
  - "Confirm This Match" buttons
- Verification modal for identity confirmation
- Back button to return to form

**Navigation:**
- **Previous:** Back button → `/` (returns to home)
- **Next:** After identity verification → `/success`

**State Management:**
- Reads complaint data from `sessionStorage`
- Stores submission data (complaint + match + verification) in `sessionStorage`
- If no complaint data found, redirects to `/`

**Modal:**
- Identity verification modal overlays this page
- Collects NRIC, name, and contact number
- Validates Singapore formats

---

### 3. **Success Page** (`/success`)
**File:** `app/success/page.tsx`

**Purpose:** Confirmation and completion

**Features:**
- Progress indicator (Step 3 of 3 - all completed)
- Large success message with checkmark
- Complaint reference details:
  - Reference ID (auto-generated)
  - Submission timestamp
  - Offending unit details
  - Confidence score
- "What Happens Next?" section with timeline
- Important notices
- Action buttons:
  - "Submit Another Complaint" → returns to `/`
  - "Print Receipt" → triggers print dialog
- Help/support information

**Navigation:**
- **Reset:** "Submit Another Complaint" button → `/` (clears all session data)

**State Management:**
- Reads submission data from `sessionStorage`
- If no submission data found, redirects to `/`
- Clears all session data on "Submit Another Complaint"

---

## Data Flow

### Session Storage Keys

1. **`complaintData`**
   - Set on: Home page form submission
   - Contains: `ComplaintFormData` object
   ```typescript
   {
     blockNumber: string,
     unitNumber: string,
     startTime: string,
     endTime: string,
     description: string
   }
   ```

2. **`submissionData`**
   - Set on: Matching results page after verification
   - Contains: Complete submission object
   ```typescript
   {
     complaint: ComplaintFormData,
     match: NoiseMatch,
     verification: IdentityVerification
   }
   ```

### Navigation Flow

```
┌─────────────────┐
│   Home Page     │
│   (/)           │
│                 │
│ - Submit Form   │
└────────┬────────┘
         │
         │ Store complaintData
         │ Navigate to /matching-results
         ▼
┌─────────────────┐
│ Matching Page   │
│ (/matching-     │
│  results)       │
│                 │
│ - View Matches  │
│ - Open Modal    │
│ - Verify ID     │
└────────┬────────┘
         │
         │ Store submissionData
         │ Navigate to /success
         ▼
┌─────────────────┐
│  Success Page   │
│  (/success)     │
│                 │
│ - View Receipt  │
│ - Submit Another│
└────────┬────────┘
         │
         │ Clear session storage
         │ Navigate to /
         ▼
   (Back to Home)
```

---

## User Journey

### Step 1: Report Submission
1. User lands on home page
2. Fills out complaint form
3. Form validates all fields
4. User clicks "Submit Complaint"
5. Data saved to session storage
6. Navigate to matching results page

### Step 2: Review Matches
1. Page loads with 2-second loading animation
2. User's complaint details displayed in summary card
3. 3 mock matching results appear
4. User reviews each match
5. User clicks "Confirm This Match" on chosen record
6. Verification modal opens
7. User enters NRIC, name, and contact number
8. Validation checks all fields
9. User clicks "Submit Complaint"
10. 1.5-second loading animation
11. Data saved to session storage
12. Navigate to success page

### Step 3: Confirmation
1. Page displays success message
2. Reference ID generated and shown
3. User reviews complaint details
4. User reads "What Happens Next" information
5. Options:
   - Print receipt for records
   - Submit another complaint (resets flow)

---

## Guard Rails

### Preventing Invalid Navigation

Each page checks for required data on mount:

**Matching Results Page:**
```typescript
useEffect(() => {
  const storedData = sessionStorage.getItem('complaintData');
  if (!storedData) {
    router.push('/'); // Redirect to home if no data
    return;
  }
  // ... continue with page logic
}, [router]);
```

**Success Page:**
```typescript
useEffect(() => {
  const storedData = sessionStorage.getItem('submissionData');
  if (!storedData) {
    router.push('/'); // Redirect to home if no data
    return;
  }
  // ... continue with page logic
}, [router]);
```

This ensures users cannot:
- Access `/matching-results` without submitting a complaint
- Access `/success` without completing verification
- See stale data from previous sessions

---

## Progress Indicator

All pages (except home) show a progress indicator:

**Step 1 (Home):** No indicator shown

**Step 2 (Matching Results):**
```
[✓] Report Submitted → [2] Review Matches → [ ] Confirmation
```

**Step 3 (Success):**
```
[✓] Report Submitted → [✓] Match Confirmed → [✓] Completed
```

---

## Mock Data

### Timing
- Form submission → Matching page: Instant navigation
- Matching results loading: 2 seconds
- Identity verification: 1.5 seconds

### Generated Data
- 3 mock matching records with varying confidence scores (95%, 78%, 88%)
- Reference ID generated using timestamp
- Different block/unit combinations for each match

---

## Responsive Design

All pages are fully responsive:

**Mobile:**
- Single column layout
- Full-width forms and cards
- Stacked buttons
- Simplified progress indicator

**Tablet:**
- 2-column form layouts
- Side-by-side buttons
- Full progress indicator

**Desktop:**
- Optimal spacing and max-width containers
- All features visible
- Trust badge in header

---

## Testing the Flow

1. Start at home page (`/`)
2. Fill in form with valid data
3. Submit to see matching results
4. Try browser back button (works correctly)
5. Select a match to open verification modal
6. Fill in verification details
7. Submit to see success page
8. Click "Submit Another Complaint"
9. Verify you're back at clean home page
10. Try accessing `/success` directly (should redirect to `/`)

---

## Future Enhancements

- [ ] Add browser history management (prevent back after success)
- [ ] Store reference ID in database
- [ ] Email receipt to user
- [ ] Add complaint tracking page
- [ ] Implement real-time status updates
- [ ] Add authentication for returning users
