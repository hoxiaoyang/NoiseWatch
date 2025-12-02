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
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load form data from sessionStorage on mount (if user navigated back)
  useEffect(() => {
    const storedData = sessionStorage.getItem('complaintData');
    if (storedData) {
      try {
        const parsedData: ComplaintFormData = JSON.parse(storedData);
        
        // Restore form data
        setFormData({
          address: parsedData.address || '',
          unitNumber: parsedData.unitNumber || '',
          startTime: parsedData.startTime || '',
          endTime: parsedData.endTime || '',
          description: parsedData.description || '',
        });

        // Restore selectedOption and customNoise based on description
        const desc = parsedData.description?.toLowerCase() || '';
        if (desc === 'shouting' || desc === 'shout') {
          setSelectedOption('Shouting');
          setCustomNoise('');
        } else if (desc === 'drilling' || desc === 'drill') {
          setSelectedOption('Drilling');
          setCustomNoise('');
        } else if (parsedData.description && parsedData.description.trim()) {
          // If description exists but doesn't match predefined options, it's "Other"
          setSelectedOption('Other');
          setCustomNoise(parsedData.description);
        }
      } catch (error) {
        console.error('Error loading form data from sessionStorage:', error);
      }
    }
    setIsInitialLoad(false);
  }, []); // Only run on mount

  // Auto-fetch address from OneMap when postal code reaches 6 digits
  // Skip auto-fetch during initial load from sessionStorage
  useEffect(() => {
    if (isInitialLoad) return; // Don't auto-fetch during initial load
    
    const v = formData.address.trim();
    if (/^\d{6}$/.test(v)) {
      fetchAddressByPostalCode(v);
    }
  }, [formData.address, isInitialLoad]);

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

    // Validate address
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (formData.address.trim().length < 5) {
      newErrors.address = 'Please enter a valid address or postal code';
    }

    if (!formData.unitNumber.trim()) {
      newErrors.unitNumber = 'Unit number is required';
    }

    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';

    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    // Validate description
    if (!selectedOption || selectedOption === '') {
      newErrors.description = 'Description of noise is required';
    } else if (selectedOption === 'Other' && !customNoise.trim()) {
      newErrors.description = 'Description of noise is required';
    } else if (!formData.description.trim()) {
      newErrors.description = 'Description of noise is required';
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
    // Clear error for the field being changed
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    // Also clear postalCode error when address changes
    if (field === 'address' && errors.postalCode) {
      setErrors((prev) => ({ ...prev, postalCode: undefined }));
    }       
  };
 
  return (
<>
    <Card>
        <CardHeader>
          <CardTitle>Report Noise Disturbance</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Auto-filled Address */}
            <Input
              label="Your Address"
              placeholder="Type a 6-digit postal code to auto-fill"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              error={errors.address || errors.postalCode}
              disabled={isLoading || isFetchingAddress}
            />
            {isFetchingAddress && (
              <p className="text-sm text-blue-600 mt-1.5">Fetching address...</p>
            )}
            {/* Unit Number only */}
            <Input
              label="Your Unit Number"
              placeholder="E.g., 05-123"
              value={formData.unitNumber}
              onChange={(e) => handleChange('unitNumber', e.target.value)}
              error={errors.unitNumber}
              disabled={isLoading}
            />
            {/* Time Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="datetime-local"
                label="Start Time of Noise Disturbance"
                value={formData.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                error={errors.startTime}
              />
              <Input
                type="datetime-local"
                label="End Time of Noise Disturbance"
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
                  // Clear description error when user selects an option
                  if (errors.description) {
                    setErrors((prev) => ({ ...prev, description: undefined }));
                  }
                  if (value === "") {
                    handleChange('description', ''); // clear description for placeholder
                  } else if (value === "Other") {
                    handleChange('description', customNoise); // keep custom input
                  } else {
                    handleChange('description', value); // save selected option
                  }
                }}
                disabled={isLoading}
                className={`border rounded px-3 py-2 w-full mb-2 ${
                  errors.description && selectedOption !== 'Other' 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300'
                }`}
              >
                <option value="">Select</option>
                {noiseOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.description && selectedOption !== 'Other' && (
                <p className="text-sm text-red-600 mt-1">{errors.description}</p>
              )}
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
              <p className="text-sm text-gray-500 mt-1.5">
                Provide as much detail as possible to help us match your complaint
              </p>
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isLoading}
            >
              {isLoading ? 'Searching for matches...' : 'Find Matches'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
};