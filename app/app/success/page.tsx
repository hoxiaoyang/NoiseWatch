'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { ComplaintFormData, NoiseMatch, IdentityVerification } from '../types';

export default function SuccessPage() {
  const router = useRouter();
  const [submissionData, setSubmissionData] = useState<{
    complaint: ComplaintFormData | null;
    match: NoiseMatch | null;
    verification: IdentityVerification | null;
  }>({ complaint: null, match: null, verification: null });

  useEffect(() => {
    // Get submission data from sessionStorage
    const storedData = sessionStorage.getItem('submissionData');
    
    if (!storedData) {
      // If no data, redirect back to home
      router.push('/');
      return;
    }

    setSubmissionData(JSON.parse(storedData));
  }, [router]);

  const handleSubmitAnother = () => {
    // Clear all session storage
    sessionStorage.removeItem('complaintData');
    sessionStorage.removeItem('submissionData');
    
    // Navigate back to home
    router.push('/');
  };

  if (!submissionData.complaint || !submissionData.match) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Progress Indicator */}
        <ProgressIndicator currentStep={4} />

        {/* Success Message */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-8 shadow-lg">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="w-full">
                <h2 className="text-2xl font-bold text-green-900 mb-3">
                  Complaint Successfully Submitted
                </h2>
                <p className="text-green-800 mb-6 text-lg">
                  Your noise complaint has been verified and submitted to the relevant authorities. 
                  You will receive updates via the contact number provided.
                </p>

                {/* Complaint Reference */}
                <div className="bg-white border border-green-200 rounded-lg p-5 mb-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Complaint Reference</h3>
                  <div className="space-y-3">                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Noise Detected:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {submissionData.match.description}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Location:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {submissionData.match.houseName}
                      </span>
                    </div>
                    {submissionData.match.startTime && submissionData.match.endTime && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Time Range:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(submissionData.match.startTime).toLocaleString('en-SG', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {' - '}
                          {new Date(submissionData.match.endTime).toLocaleString('en-SG', {
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
                        {submissionData.match.confidenceScore}%
                      </span>
                    </div>
                    <div className="border-t border-gray-200 my-3"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Reference ID:</span>
                      <span className="text-sm font-mono font-medium text-gray-900">
                        NW-{Date.now().toString().slice(-8)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Submitted:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date().toLocaleString('en-SG', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* What Happens Next */}
                <div className="bg-white border border-green-200 rounded-lg p-5 mb-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    What Happens Next?
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-blue-600 font-bold text-xs">1</span>
                      </div>
                      <span className="text-sm text-gray-700">Authorities will review your complaint within <strong>1-2 business days</strong></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-blue-600 font-bold text-xs">2</span>
                      </div>
                      <span className="text-sm text-gray-700">You'll receive <strong>SMS updates</strong> on the investigation progress</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-blue-600 font-bold text-xs">3</span>
                      </div>
                      <span className="text-sm text-gray-700">Your identity remains <strong>confidential</strong> throughout the process</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-blue-600 font-bold text-xs">4</span>
                      </div>
                      <span className="text-sm text-gray-700">The offending party will be contacted and appropriate action will be taken</span>
                    </li>
                  </ul>
                </div>

                {/* Important Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">Save Your Reference ID</p>
                      <p className="text-sm text-blue-800">
                        Keep your reference ID for tracking purposes. You may be contacted for additional information if needed.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleSubmitAnother}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                  >
                    Submit Another Complaint
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex-1 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Print Receipt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Support Info */}
        <div className="max-w-3xl mx-auto mt-10">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-4">
              If you have questions about your complaint or need to provide additional information, 
              please contact your local town council with your reference ID.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Town Council Hotline</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Email Support</span>
              </div>
            </div>
          </div>
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
