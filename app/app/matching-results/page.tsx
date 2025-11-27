'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MatchingResults } from '../components/MatchingResults';
import { VerificationModal } from '../components/VerificationModal';
import { ComplaintFormData, NoiseMatch, IdentityVerification } from '../types';
import { generateMockMatches } from '../utils/mockData';

export default function MatchingResultsPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<NoiseMatch[]>([]);
  const [isSearching, setIsSearching] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<NoiseMatch | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [complaintData, setComplaintData] = useState<ComplaintFormData | null>(null);

  useEffect(() => {
    const storedData = sessionStorage.getItem('complaintData');
    
    if (!storedData) {
      router.push('/');
      return;
    }

    setComplaintData(JSON.parse(storedData));

    const searchForMatches = async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockMatches = generateMockMatches();
      setMatches(mockMatches);
      setIsSearching(false);
    };

    searchForMatches();
  }, [router]);

  const handleSelectMatch = (match: NoiseMatch) => {
    setSelectedMatch(match);
    setIsModalOpen(true);
  };

  const handleVerificationConfirm = async (verification: IdentityVerification) => {
    const submissionData = {
      complaint: complaintData,
      match: selectedMatch,
      verification,
    };
    
    sessionStorage.setItem('submissionData', JSON.stringify(submissionData));
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    router.push('/success');
  };

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
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
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">NoiseWatch</h1>
                <p className="text-sm text-gray-600">Matching Results</p>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Progress */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Report Submitted</span>
            </div>
            <div className="h-px bg-gray-300 w-16"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <span className="text-sm font-medium text-blue-600">Review Matches</span>
            </div>
            <div className="h-px bg-gray-300 w-16"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">3</span>
              </div>
              <span className="text-sm font-medium text-gray-500">Confirmation</span>
            </div>
          </div>
        </div>

        {/* Complaint Summary */}
        {complaintData && !isSearching && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Your Complaint Details</h3>
              <div className="text-sm">
                <span className="text-gray-600">Unit:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {complaintData.unitNumber}
                </span>
              </div>

              <div className="mt-3">
                <span className="text-gray-600 text-sm">Time Range:</span>
                <div className="ml-2 font-medium text-gray-900">
                  {new Date(complaintData.startTime).toLocaleString('en-SG', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  {' - '}
                  {new Date(complaintData.endTime).toLocaleString('en-SG', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              <div className="mt-3">
                <span className="text-gray-600 text-sm">Description:</span>
                <p className="mt-1 text-gray-900">{complaintData.description}</p>
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
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
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

      {/* Verification Modal */}
      <VerificationModal
        isOpen={isModalOpen}
        selectedMatch={selectedMatch}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleVerificationConfirm}
      />
    </div>
  );
}
