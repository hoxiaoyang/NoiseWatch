'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MatchingResults } from '../components/MatchingResults';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { ComplaintFormData, NoiseMatch } from '../types';

export default function MatchingResultsPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<NoiseMatch[]>([]);
  const [isSearching, setIsSearching] = useState(true);
  const [complaintData, setComplaintData] = useState<ComplaintFormData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState<number | undefined>(undefined);

  useEffect(() => {
    const storedData = sessionStorage.getItem('complaintData');
    
    if (!storedData) {
      router.push('/');
      return;
    }

    const parsedData = JSON.parse(storedData);
    setComplaintData(parsedData);

    const searchForMatches = async () => {
      try {
        setIsSearching(true);
        setError(null); // Clear any previous errors
        
        // Call the API to search for matches
        const response = await fetch('/api/search-matches', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(parsedData),
        });

        if (!response.ok) {
          let errorMessage = 'Failed to search for matches';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            // If response is not JSON, use status text
            errorMessage = `Error ${response.status}: ${response.statusText || errorMessage}`;
          }
          console.error('API Error:', errorMessage, 'Status:', response.status);
          
          // For testing: fallback to mock data if API fails
          // Remove this in production or add USE_MOCK_FALLBACK env variable
          const useMockFallback = process.env.NEXT_PUBLIC_USE_MOCK_FALLBACK === 'true';
          if (useMockFallback) {
            console.log('API failed, using mock data fallback');
            const { generateMockMatches } = await import('../utils/mockData');
            setMatches(generateMockMatches());
            setError(null);
            return;
          }
          
          setError(errorMessage);
          setMatches([]);
          return;
        }

        const data = await response.json();
        setMatches(data.matches || []);
        setTotalRecords(data.totalRecords); // Store total records for confidence calculation
        setError(null); // Clear error on success
      } catch (error) {
        console.error('Error searching for matches:', error);
        // Log the full error for debugging
        let errorMessage = 'An unexpected error occurred while searching for matches';
        if (error instanceof Error) {
          console.error('Error details:', error.message);
          errorMessage = error.message;
        }
        setError(errorMessage);
        setMatches([]);
      } finally {
        setIsSearching(false);
      }
    };

    searchForMatches();
  }, [router]);

  const handleSelectMatch = (match: NoiseMatch) => {
    // Store selected match in sessionStorage
    sessionStorage.setItem('selectedMatch', JSON.stringify(match));
    // Navigate to verification page
    router.push('/verify-identity');
  };

  const handleBack = () => {
    router.push('/');
  };

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
                title="Back to form"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="bg-blue-600 rounded-lg p-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-megaphone-icon lucide-megaphone"
                >
                  <path d="M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
                  <path d="M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14" />
                  <path d="M8 6v8" />
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
        <ProgressIndicator currentStep={2} />

        {/* Complaint Summary */}
        {complaintData && !isSearching && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Complaint Details</h3>
              <div className="space-y-3">
                {complaintData.address && (
                  <div className="flex items-start">
                    <span className="text-sm text-gray-600 min-w-[100px]">Your Address:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {complaintData.address}
                    </span>
                  </div>
                )}

                <div className="flex items-start">
                  <span className="text-sm text-gray-600 min-w-[100px]">Your Unit:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {complaintData.unitNumber}
                  </span>
                </div>

                <div className="flex items-start">
                  <span className="text-sm text-gray-600 min-w-[100px]">Time Range:</span>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(complaintData.startTime).toLocaleString('en-SG', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {' - '}
                    {new Date(complaintData.endTime).toLocaleString('en-SG', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                <div className="flex items-start">
                  <span className="text-sm text-gray-600 min-w-[100px]">Description:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {complaintData.description}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !isSearching && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-5">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-900 mb-1">Error Searching for Matches</p>
                  <p className="text-sm text-red-800">{error}</p>
                  {error.includes('Lambda endpoint not configured') && (
                    <p className="text-xs text-red-700 mt-2">
                      Please check your .env.local file and ensure LAMBDA_GET_HOUSE_WITHOUT_LABEL_ENDPOINT is set.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Matches */}
        <div className="max-w-3xl mx-auto">
          <MatchingResults
            matches={matches}
            onSelectMatch={handleSelectMatch}
            isLoading={isSearching}
            totalRecords={totalRecords}
          />
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
