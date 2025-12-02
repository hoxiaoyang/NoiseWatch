// Types for NoiseWatch Application

export interface ComplaintFormData {
  address: string;
  unitNumber: string;
  startTime: string;
  endTime: string;
  description: string;
}

export interface NoiseMatch {
  id: string;
  houseName: string;
  timestamp: string;
  confidenceScore: number;
  description: string;
  startTime?: string; // Earliest timestamp when combining multiple records
  endTime?: string; // Latest timestamp when combining multiple records
}

export interface IdentityVerification {
  nric: string;
  name: string;
  contactNumber: string;
}

export interface ComplaintSubmission {
  complaint: ComplaintFormData;
  selectedMatch: NoiseMatch;
  verification: IdentityVerification;
}
