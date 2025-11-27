// Types for NoiseWatch Application

export interface ComplaintFormData {
  unitNumber: string;
  startTime: string;
  endTime: string;
  description: string;
}

export interface NoiseMatch {
  id: string;
  offendingBlock: string;
  offendingUnit: string;
  timestamp: string;
  confidenceScore: number;
  description: string;
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
