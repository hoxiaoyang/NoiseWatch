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
    const v = formData.address.trim();
    if (/^\d{6}$/.test(v)) {
      fetchAddressByPostalCode(v);
    }
  }, [formData.address]);

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

  const noiseOptions = [
    "Shouting",
    "Drilling",
    "Other",
  ];

  const [selectedOption, setSelectedOption] = useState<string>(""); 
  const [customNoise, setCustomNoise] = useState('');

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<string, string>> = {};

    if (!formData.unitNumber.trim()) {
      newErrors.unitNumber = 'Unit number is required';
    }

    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';

    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 1) {
      newErrors.description = 'Please provide a description of the noise disturbance';
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

          {/* Auto-filled Address */}
          <Input
          label="Address"
          placeholder="Enter postal code or full address"
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          helperText={
          /^\d{6}$/.test(formData.address)
          ? isFetchingAddress ? 'Fetching address...' : 'Postal code detected'
          : 'Type a 6-digit postal code to auto-fill'
          }
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description of Noise
            </label>

            {/* Dropdown */}
            <select
              value={selectedOption}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedOption(value);

                if (value === "Other") {
                  handleChange('description', customNoise); // keep custom input
                } else {
                  handleChange('description', value); // save selected option
                }
              }}
              disabled={isLoading}
              className="border rounded px-3 py-2 w-full mb-2"
            >
              {noiseOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            {/* Custom input shows only if "Other" is selected */}
            {selectedOption === "Other" && (
              <Input
                placeholder="e.g., Loud music, banging sounds"
                value={customNoise}
                onChange={(e) => {
                  const value = e.target.value;
                  setCustomNoise(value);
                  handleChange('description', value); // update formData
                }}
                disabled={isLoading}
                error={errors.description}
              />
            )}

            <p className="text-gray-500 text-sm mt-1">
              Provide as much detail as possible to help us match your complaint
            </p>
          </div>


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
