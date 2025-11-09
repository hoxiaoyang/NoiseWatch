'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input, TextArea } from './ui/Input';
import { ComplaintFormData } from '../types';

interface ComplaintFormProps {
  onSubmit: (data: ComplaintFormData) => void;
  isLoading?: boolean;
}

export const ComplaintForm: React.FC<ComplaintFormProps> = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState<ComplaintFormData>({
    blockNumber: '',
    unitNumber: '',
    startTime: '',
    endTime: '',
    description: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ComplaintFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ComplaintFormData, string>> = {};

    if (!formData.blockNumber.trim()) {
      newErrors.blockNumber = 'Block number is required';
    }

    if (!formData.unitNumber.trim()) {
      newErrors.unitNumber = 'Unit number is required';
    } else if (!/^\d{2}-\d{2,4}$/.test(formData.unitNumber.trim())) {
      newErrors.unitNumber = 'Please use format: ##-### (e.g., 05-123)';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
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

  const handleChange = (field: keyof ComplaintFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Noise Disturbance</CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Please provide details about the noise disturbance you experienced. Your information is secure and confidential.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Your Block Number"
              placeholder="e.g., 123"
              value={formData.blockNumber}
              onChange={(e) => handleChange('blockNumber', e.target.value)}
              error={errors.blockNumber}
              disabled={isLoading}
              helperText="Enter your HDB block number"
            />
            <Input
              label="Your Unit Number"
              placeholder="e.g., 05-123"
              value={formData.unitNumber}
              onChange={(e) => handleChange('unitNumber', e.target.value)}
              error={errors.unitNumber}
              disabled={isLoading}
              helperText="Format: ##-###"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="datetime-local"
              label="Start Time"
              value={formData.startTime}
              onChange={(e) => handleChange('startTime', e.target.value)}
              error={errors.startTime}
              disabled={isLoading}
              helperText="When did the noise start?"
            />
            <Input
              type="datetime-local"
              label="End Time"
              value={formData.endTime}
              onChange={(e) => handleChange('endTime', e.target.value)}
              error={errors.endTime}
              disabled={isLoading}
              helperText="When did the noise end?"
            />
          </div>

          <TextArea
            label="Description of Noise"
            placeholder="Please describe the noise disturbance (e.g., loud music, drilling, shouting, etc.)"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            error={errors.description}
            disabled={isLoading}
            rows={4}
            helperText="Provide as much detail as possible to help us match your complaint"
          />

          <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-800">
              Your report will be processed securely. We will match it with our noise monitoring data to identify the source.
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? 'Searching for matches...' : 'Submit Complaint'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
