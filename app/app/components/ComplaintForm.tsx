'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input, TextArea } from './ui/Input';
import { ComplaintFormData } from '../types';

interface ComplaintFormProps {
  onSubmit: (data: ComplaintFormData) => void;
  isLoading?: boolean;
}

export const ComplaintForm: React.FC<ComplaintFormProps> = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState({
    postalCode: '',
    address: '',
    unitNumber: '',
    startTime: '',
    endTime: '',
    description: '',
  });

  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);

  // Auto-fetch address from OneMap when postal code reaches 6 digits
  useEffect(() => {
    if (formData.postalCode.length === 6) {
      fetchAddressByPostalCode(formData.postalCode);
    }
  }, [formData.postalCode]);

  // OneMap API fetch (JS version of your Python code)
  const fetchAddressByPostalCode = async (postalCode: string) => {
    try {
      setIsFetchingAddress(true);
      const res = await fetch(
        `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${postalCode}&returnGeom=Y&getAddrDetails=Y`
      );
      const data = await res.json();

      if (data?.results?.length > 0) {
        const address = data.results[0].ADDRESS;

        setFormData((prev) => ({
          ...prev,
          address,
        }));
      } else {
        setFormData((prev) => ({ ...prev, address: '' }));
        setErrors((prev) => ({ ...prev, postalCode: 'Invalid postal code. Address not found.' }));
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, postalCode: 'Failed to fetch address. Try again.' }));
    } finally {
      setIsFetchingAddress(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<string, string>> = {};

    if (!formData.postalCode.trim() || formData.postalCode.length !== 6) {
      newErrors.postalCode = 'Valid postal code is required';
    }

    if (!formData.unitNumber.trim()) {
      newErrors.unitNumber = 'Unit number is required';
    }

    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';

    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    if (!formData.description.trim() || formData.description.trim().length < 10) {
      newErrors.description = 'Please provide at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Noise Disturbance</CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Enter your postal code and we will automatically retrieve your full address.
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Postal Code */}
          <Input
            label="Postal Code"
            placeholder="e.g., 560123"
            value={formData.postalCode}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            error={errors.postalCode}
            disabled={isLoading}
            helperText="Enter your 6-digit HDB postal code"
          />

          {/* Auto-filled Address */}
          <Input
            label="Address (Auto-filled)"
            placeholder="Full address will appear here"
            value={formData.address}
            disabled
            helperText={isFetchingAddress ? 'Fetching address...' : ''}
          />

          {/* Unit Number only */}
          <Input
            label="Unit Number"
            placeholder="e.g., 05-123"
            value={formData.unitNumber}
            onChange={(e) => handleChange('unitNumber', e.target.value)}
            error={errors.unitNumber}
            disabled={isLoading}
          />

          {/* Time Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="datetime-local"
              label="Start Time"
              value={formData.startTime}
              onChange={(e) => handleChange('startTime', e.target.value)}
              error={errors.startTime}
            />
            <Input
              type="datetime-local"
              label="End Time"
              value={formData.endTime}
              onChange={(e) => handleChange('endTime', e.target.value)}
              error={errors.endTime}
            />
          </div>

          {/* Description */}
          <TextArea
            label="Description of Noise"
            placeholder="Describe the noise disturbance"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            error={errors.description}
            rows={4}
          />

          {/* Submit */}
          <Button type="submit" variant="primary" size="lg" fullWidth disabled={isLoading}>
            {isLoading ? 'Searching for matches...' : 'Submit Complaint'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
