'use client';

import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { NoiseMatch, IdentityVerification } from '../types';

interface VerificationModalProps {
  isOpen: boolean;
  selectedMatch: NoiseMatch | null;
  onClose: () => void;
  onConfirm: (verification: IdentityVerification) => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  selectedMatch,
  onClose,
  onConfirm,
}) => {
  const [verification, setVerification] = useState<IdentityVerification>({
    nric: '',
    name: '',
    contactNumber: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof IdentityVerification, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      onConfirm(verification);
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof IdentityVerification, value: string) => {
    setVerification(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen || !selectedMatch) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Verify Your Identity</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Secure Verification Required</p>
                <p className="text-sm text-blue-800">
                  To submit an official complaint to the authorities, we need to verify your identity. Your information is encrypted and protected.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Selected Noise Record:</h4>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Location:</span> Block {selectedMatch.offendingBlock}, Unit {selectedMatch.offendingUnit}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Time:</span> {new Date(selectedMatch.timestamp).toLocaleString('en-SG')}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Confidence:</span> {selectedMatch.confidenceScore}%
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="NRIC/FIN"
              placeholder="S1234567A"
              value={verification.nric}
              onChange={(e) => handleChange('nric', e.target.value.toUpperCase())}
              error={errors.nric}
              disabled={isSubmitting}
              maxLength={9}
              helperText="Your identification number"
            />

            <Input
              label="Full Name"
              placeholder="As per NRIC"
              value={verification.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={errors.name}
              disabled={isSubmitting}
              helperText="Enter your full legal name"
            />

            <Input
              label="Contact Number"
              placeholder="91234567"
              type="tel"
              value={verification.contactNumber}
              onChange={(e) => handleChange('contactNumber', e.target.value)}
              error={errors.contactNumber}
              disabled={isSubmitting}
              maxLength={8}
              helperText="For verification and updates"
            />

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex gap-2">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs text-yellow-800">
                  By submitting, you confirm that the information provided is accurate and understand that false reports may result in legal consequences.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="success"
                fullWidth
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
