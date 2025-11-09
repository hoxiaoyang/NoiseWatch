# API Integration Guide

This document describes the API routes that need to be integrated with AWS Lambda functions.

## API Routes

### 1. Search for Matching Noise Records
**Endpoint:** `POST /api/search-matches`

**Purpose:** Search the noise monitoring database for records that match the user's complaint.

**Request Body:**
```json
{
  "blockNumber": "123",
  "unitNumber": "05-123",
  "startTime": "2025-11-09T14:00:00.000Z",
  "endTime": "2025-11-09T16:00:00.000Z",
  "description": "Loud music and bass sounds"
}
```

**Response:**
```json
{
  "matches": [
    {
      "id": "match-123",
      "offendingBlock": "124",
      "offendingUnit": "06-145",
      "timestamp": "2025-11-09T15:23:45.000Z",
      "confidenceScore": 95,
      "description": "High-decibel noise detected: Loud music and bass sounds"
    }
  ]
}
```

**AWS Lambda Integration:**
- Query DynamoDB/RDS for noise records within time range
- Calculate confidence scores based on proximity and time matching
- Return sorted results by confidence score

---

### 2. Verify User Identity
**Endpoint:** `POST /api/verify-identity`

**Purpose:** Verify the user's identity using Singapore government APIs.

**Request Body:**
```json
{
  "nric": "S1234567A",
  "name": "John Doe",
  "contactNumber": "91234567"
}
```

**Response:**
```json
{
  "verified": true,
  "message": "Identity verified successfully"
}
```

**AWS Lambda Integration:**
- Integrate with SingPass/MyInfo API
- Verify NRIC format and validity
- Validate contact number
- Return verification status

---

### 3. Submit Complaint to Authorities
**Endpoint:** `POST /api/submit-complaint`

**Purpose:** Submit the verified complaint to the relevant authorities.

**Request Body:**
```json
{
  "complaint": {
    "blockNumber": "123",
    "unitNumber": "05-123",
    "startTime": "2025-11-09T14:00:00.000Z",
    "endTime": "2025-11-09T16:00:00.000Z",
    "description": "Loud music and bass sounds"
  },
  "selectedMatch": {
    "id": "match-123",
    "offendingBlock": "124",
    "offendingUnit": "06-145",
    "timestamp": "2025-11-09T15:23:45.000Z",
    "confidenceScore": 95,
    "description": "High-decibel noise detected"
  },
  "verification": {
    "nric": "S1234567A",
    "name": "John Doe",
    "contactNumber": "91234567"
  }
}
```

**Response:**
```json
{
  "success": true,
  "complaintId": "COMPLAINT-1699531234567",
  "message": "Complaint submitted successfully"
}
```

**AWS Lambda Integration:**
- Store complaint in database with unique ID
- Send notification to HDB/Town Council API
- Send SMS confirmation to user
- Log submission for audit trail
- Return complaint ID for tracking

---

## Security Considerations

1. **Authentication & Authorization:**
   - Implement JWT tokens or API keys
   - Rate limiting to prevent abuse
   - CORS configuration for frontend domain

2. **Data Encryption:**
   - Encrypt sensitive data (NRIC, contact numbers) at rest
   - Use HTTPS for all API communications
   - Implement request signing for AWS Lambda

3. **Data Privacy:**
   - Comply with PDPA (Personal Data Protection Act)
   - Implement data retention policies
   - Anonymize data where possible

4. **Input Validation:**
   - Validate all input fields
   - Sanitize data to prevent injection attacks
   - Implement request size limits

---

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# AWS Configuration
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Lambda Function ARNs
LAMBDA_SEARCH_MATCHES_ARN=arn:aws:lambda:region:account:function:search-matches
LAMBDA_VERIFY_IDENTITY_ARN=arn:aws:lambda:region:account:function:verify-identity
LAMBDA_SUBMIT_COMPLAINT_ARN=arn:aws:lambda:region:account:function:submit-complaint

# External APIs
SINGPASS_API_URL=https://api.singpass.gov.sg
SINGPASS_CLIENT_ID=your-client-id
SINGPASS_CLIENT_SECRET=your-client-secret

# Database
DATABASE_URL=your-database-connection-string

# SMS Service
SMS_API_KEY=your-sms-api-key
```

---

## Next Steps

1. Set up AWS Lambda functions for each route
2. Configure API Gateway or use Lambda function URLs
3. Update the API route files with actual Lambda invocations
4. Test each endpoint thoroughly
5. Implement error handling and logging
6. Set up monitoring and alerts
