# NoiseWatch - HDB Noise Complaint Management System

A modern, user-friendly web application for HDB residents to report noise disturbances and match them with verified sensor data.

## 🎯 Features

### User Interface
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Intuitive Form**: Easy-to-use complaint submission with validation
- **Real-time Matching**: Automatic matching with noise monitoring sensor data
- **Secure Verification**: Identity verification modal for official complaint submission
- **Visual Feedback**: Clear status indicators and confidence scores for matches

### Security & Trust
- **Data Encryption**: All sensitive information is protected
- **PDPA Compliant**: Follows Singapore's Personal Data Protection Act
- **Verified Data**: Matches from certified noise monitoring equipment
- **Confidential**: User identity remains protected throughout the process

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the app directory:
```bash
cd app
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
app/
├── app/
│   ├── api/                    # API routes for AWS Lambda integration
│   │   ├── search-matches/     # Search for matching noise records
│   │   ├── submit-complaint/   # Submit complaint to authorities
│   │   └── verify-identity/    # Verify user identity
│   ├── components/             # React components
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Input.tsx
│   │   ├── ComplaintForm.tsx
│   │   ├── MatchingResults.tsx
│   │   └── VerificationModal.tsx
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/                  # Utility functions
│   │   └── mockData.ts
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── public/                     # Static assets
├── API_INTEGRATION.md          # API integration guide
└── package.json
```

## 🎨 Design Philosophy

### Color Scheme
- **Primary Blue (#2563eb)**: Trust, security, reliability
- **Success Green (#16a34a)**: Confirmation, positive actions
- **Warning Yellow (#eab308)**: Important notices
- **Neutral Grays**: Clean, professional interface

### User Experience
1. **Assurance First**: Every step emphasizes security and confidentiality
2. **Clear Feedback**: Users always know what's happening
3. **Progressive Disclosure**: Information revealed as needed
4. **Accessibility**: WCAG compliant with proper contrast and focus states

## 📱 User Journey

1. **Report Submission**
   - User enters their block and unit number
   - Specifies time range of noise disturbance
   - Provides description of the noise

2. **Matching**
   - System searches verified sensor data
   - Returns potential matches with confidence scores
   - User reviews and selects the correct match

3. **Verification**
   - User verifies identity (NRIC, name, contact)
   - System validates information
   - Complaint is submitted to authorities

4. **Confirmation**
   - Success message with next steps
   - SMS notification sent to user
   - Complaint ID provided for tracking

## 🔌 API Integration

The application has placeholder routes ready for AWS Lambda integration:

- **POST /api/search-matches** - Search noise monitoring database
- **POST /api/verify-identity** - Verify user with SingPass/MyInfo
- **POST /api/submit-complaint** - Submit to HDB/Town Council

See [API_INTEGRATION.md](./API_INTEGRATION.md) for detailed integration guide.

## 🧪 Testing

Currently using mock data for demonstration. To test the application:

1. Fill in the complaint form with any valid data
2. System will return 3 mock matching records
3. Select a match to open verification modal
4. Submit verification to see success message

### Sample Test Data
- **Block Number**: 123
- **Unit Number**: 05-123 (format: ##-###)
- **Time**: Any datetime in the past
- **Description**: At least 10 characters
- **NRIC**: S1234567A (format: [STFG]#######[A-Z])
- **Contact**: 91234567 (format: [689]#######)

## 🛠️ Technology Stack

- **Framework**: Next.js 16.0.1 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Runtime**: React 19.2.0
- **Future Integration**: AWS Lambda, DynamoDB, SingPass

## 📝 Component Documentation

### ComplaintForm
Handles initial complaint submission with validation for:
- Block number (required)
- Unit number (format: ##-###)
- Start/End time (datetime validation)
- Description (minimum 10 characters)

### MatchingResults
Displays matched noise records with:
- Confidence score badges
- Location information
- Timestamp
- Description
- Selection buttons

### VerificationModal
Identity verification interface with:
- NRIC/FIN validation
- Full name input
- Contact number validation
- Privacy assurance messages

## 🔒 Security Features

- Input validation and sanitization
- NRIC format validation
- Singapore phone number validation
- Secure data handling
- HTTPS enforcement (production)
- Rate limiting (to be implemented)

## 🚧 Future Enhancements

- [ ] Integrate with AWS Lambda functions
- [ ] Connect to real noise monitoring database
- [ ] Implement SingPass authentication
- [ ] Add SMS notification service
- [ ] Create admin dashboard
- [ ] Implement complaint tracking
- [ ] Add analytics and reporting
- [ ] Multi-language support

## 📄 License

This project is part of the NoiseWatch initiative for HDB noise complaint management.

## 🤝 Contributing

Please ensure all contributions maintain the security and privacy standards required for handling resident data.

---

For questions or support, contact your local town council.
