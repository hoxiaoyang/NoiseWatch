'use client';

import React from 'react';

interface ProgressIndicatorProps {
  currentStep: 1 | 2 | 3 | 4;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep }) => {
  const steps = [
    { number: 1, label: 'Provide Details' },
    { number: 2, label: 'Review Matches' },
    { number: 3, label: 'Verify Identity' },
    { number: 4, label: 'Confirmation' },
  ];

  return (
    <div className="max-w-3xl mx-auto mb-10">
      <div className="flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isUpcoming = currentStep < step.number;

          return (
            <React.Fragment key={step.number}>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? 'bg-green-500'
                      : isCurrent
                      ? 'bg-blue-500'
                      : 'bg-gray-300'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className={`text-sm font-bold ${isCurrent ? 'text-white' : 'text-gray-600'}`}>
                      {step.number}
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs sm:text-sm font-medium whitespace-nowrap ${
                    isCompleted
                      ? 'text-gray-700'
                      : isCurrent
                      ? 'text-blue-600'
                      : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-px w-4 sm:w-8 flex-shrink-0 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

