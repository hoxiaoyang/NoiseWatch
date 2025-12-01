'use client';

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { NoiseMatch } from '../types';

interface MatchingResultsProps {
  matches: NoiseMatch[];
  onSelectMatch: (match: NoiseMatch) => void;
  isLoading?: boolean;
}

interface GroupedMatch {
  houseName: string;
  records: NoiseMatch[];
  maxConfidence: number;
}

export const MatchingResults: React.FC<MatchingResultsProps> = ({
  matches,
  onSelectMatch,
  isLoading = false,
}) => {
  // Group matches by houseName
  const groupedMatches = useMemo(() => {
    const grouped = new Map<string, NoiseMatch[]>();
    
    matches.forEach((match) => {
      if (!grouped.has(match.houseName)) {
        grouped.set(match.houseName, []);
      }
      grouped.get(match.houseName)!.push(match);
    });
    
    // Convert to array and sort by max confidence score
    const result: GroupedMatch[] = Array.from(grouped.entries()).map(([houseName, records]) => {
      const maxConfidence = Math.max(...records.map(r => r.confidenceScore));
      // Sort records by timestamp (most recent first)
      records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return { houseName, records, maxConfidence };
    });
    
    // Sort groups by max confidence (highest first)
    result.sort((a, b) => b.maxConfidence - a.maxConfidence);
    
    return result;
  }, [matches]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-SG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-green-700 bg-green-100';
    if (score >= 70) return 'text-yellow-700 bg-yellow-100';
    return 'text-orange-700 bg-orange-100';
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 90) return 'High';
    if (score >= 70) return 'Medium';
    return 'Low';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Analyzing noise patterns and matching with recorded data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (matches.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matching Noise Records Found</CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          We found {groupedMatches.length} {groupedMatches.length === 1 ? 'house' : 'houses'} with {matches.length} potential {matches.length === 1 ? 'match' : 'matches'} from our noise monitoring system.
          Please review and select the incident that matches your complaint.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {groupedMatches.map((group) => (
            <div
              key={group.houseName}
              className="border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all duration-200"
            >
              {/* Card Header with House ID and Confidence Score (fixed top-right) */}
              <div className="relative p-5 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-base font-semibold text-gray-900">
                    {group.houseName}
                  </span>
                </div>
                {/* Confidence badge fixed to top-right */}
                <div className="absolute top-5 right-5">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getConfidenceColor(group.maxConfidence)}`}>
                    {getConfidenceLabel(group.maxConfidence)} ({group.maxConfidence}%)
                  </span>
                </div>
              </div>

              {/* Scrollable Records Container */}
              <div className="p-5">
                <div className="h-24 overflow-y-auto pr-2 space-y-3">
                  {group.records.map((match) => (
                    <div
                      key={match.id}
                      className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatTimestamp(match.timestamp)}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className={`text-xs font-medium ${getConfidenceColor(match.confidenceScore)} px-2 py-0.5 rounded`}>
                          {match.confidenceScore}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">
                        Noise Detected: {match.description}
                      </p>
                    </div>
                  ))}
                </div>
                
                {/* Single Select Button for All Records */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={() => {
                      // Combine all records for this houseName
                      const timestamps = group.records.map(r => new Date(r.timestamp).getTime());
                      const startTime = new Date(Math.min(...timestamps)).toISOString();
                      const endTime = new Date(Math.max(...timestamps)).toISOString();
                      
                      // Create a combined match with all records
                      const combinedMatch: NoiseMatch = {
                        id: `${group.houseName}_combined`,
                        houseName: group.houseName,
                        timestamp: group.records[0].timestamp, // Use first record's timestamp as primary
                        confidenceScore: group.maxConfidence,
                        description: group.records.map(r => r.description).join(', '), // Combine descriptions
                        startTime: startTime,
                        endTime: endTime,
                      };
                      
                      onSelectMatch(combinedMatch);
                    }}
                  >
                    Select This Record ({group.records.length} {group.records.length === 1 ? 'record' : 'records'})
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-5 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-900 mb-1">Verified System Data</p>
              <p className="text-sm text-green-800">
                These results are from our certified noise monitoring system. All timestamps and locations are accurate and can be used as evidence.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
