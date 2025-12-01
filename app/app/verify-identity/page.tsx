'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { ComplaintFormData, NoiseMatch, IdentityVerification } from '../types';

export default function VerifyIdentityPage() {
  const router = useRouter();
  const [verification, setVerification] = useState<IdentityVerification>({
    nric: '',
    name: '',
    contactNumber: '',
  });
  const [selectedMatch, setSelectedMatch] = useState<NoiseMatch | null>(null);
  const [complaintData, setComplaintData] = useState<ComplaintFormData | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof IdentityVerification, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Get selected match and complaint data from sessionStorage
    const storedMatch = sessionStorage.getItem('selectedMatch');
    const storedComplaint = sessionStorage.getItem('complaintData');
    
    if (!storedMatch || !storedComplaint) {
      router.push('/matching-results');
      return;
    }

    setSelectedMatch(JSON.parse(storedMatch));
    setComplaintData(JSON.parse(storedComplaint));
  }, [router]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof IdentityVerification, string>> = {};

    if (!verification.nric.trim()) {
      newErrors.nric = 'NRIC/FIN is required';
    } else if (!/^[STFG]\d{7}[A-Z]$/i.test(verification.nric.trim())) {
      newErrors.nric = 'Please enter a valid NRIC/FIN (e.g., S1234567A)';
    }

    if (!verification.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (verification.name.trim().length < 2) {
      newErrors.name = 'Please enter your full name';
    }

    if (!verification.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!/^[689]\d{7}$/.test(verification.contactNumber.trim())) {
      newErrors.contactNumber = 'Please enter a valid SG number (e.g., 91234567)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      
      // Store submission data
      const submissionData = {
        complaint: complaintData,
        match: selectedMatch,
        verification,
      };
      
      sessionStorage.setItem('submissionData', JSON.stringify(submissionData));
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      router.push('/success');
    }
  };

  const handleChange = (field: keyof IdentityVerification, value: string) => {
    setVerification(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBack = () => {
    router.push('/matching-results');
  };

  if (!selectedMatch || !complaintData) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to matches"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="bg-blue-600 rounded-lg p-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">NoiseWatch</h1>
                <p className="text-sm text-gray-600">HDB Noise Complaint Management</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm font-medium text-green-900">Secure & Confidential</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Progress */}
        <ProgressIndicator currentStep={3} />

        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Verify Your Identity</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Selected Match Summary */}
              <div className="mb-6 p-5 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="text-base font-semibold text-gray-900 mb-4">Selected Noise Record:</h4>
                <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Noise Detected:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedMatch.description}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Location:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedMatch.houseName}
                    </span>
                  </div>
                  {selectedMatch.startTime && selectedMatch.endTime ? (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Time Range:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(selectedMatch.startTime).toLocaleString('en-SG', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {' - '}
                        {new Date(selectedMatch.endTime).toLocaleString('en-SG', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Time:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(selectedMatch.timestamp).toLocaleString('en-SG', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Confidence Score:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedMatch.confidenceScore}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="mb-6 p-5 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">Secure Verification Required</p>
                    <p className="text-sm text-blue-800">
                      Your information is encrypted and only shared with authorized personnel for investigation purposes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Verification Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="NRIC/FIN"
                  placeholder="E.g., S1234567A"
                  value={verification.nric}
                  onChange={(e) => handleChange('nric', e.target.value.toUpperCase())}
                  error={errors.nric}
                  disabled={isSubmitting}
                  maxLength={9}
                />

                <Input
                  label="Full Name"
                  placeholder="As per NRIC"
                  value={verification.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={errors.name}
                  disabled={isSubmitting}
                />

                <Input
                  label="Contact Number"
                  placeholder="E.g., 91234567"
                  type="tel"
                  value={verification.contactNumber}
                  onChange={(e) => handleChange('contactNumber', e.target.value)}
                  error={errors.contactNumber}
                  disabled={isSubmitting}
                  maxLength={8}
                />

                <div className="p-5 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm text-yellow-800">
                      By submitting, you confirm that the information provided is accurate and understand that false reports may result in legal consequences.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth
                    onClick={handleBack}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              © 2025 NoiseWatch. A community initiative for peaceful living in HDB neighborhoods.
            </p>
            <p className="text-gray-500 text-xs mt-2">
              For technical support or inquiries, contact your local town council.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

