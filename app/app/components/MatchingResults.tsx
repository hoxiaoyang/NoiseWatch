'use client';

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { NoiseMatch } from '../types';

interface MatchingResultsProps {
  matches: NoiseMatch[];
  onSelectMatch: (match: NoiseMatch) => void;
  isLoading?: boolean;
  totalRecords?: number; // Total records from all houses (regardless of noise class)
}

interface DescriptionGroup {
  description: string;
  records: NoiseMatch[];
  maxConfidence: number;
}

interface GroupedMatch {
  houseName: string;
  descriptionGroups: DescriptionGroup[];
  maxConfidence: number;
}

export const MatchingResults: React.FC<MatchingResultsProps> = ({
  matches,
  onSelectMatch,
  isLoading = false,
  totalRecords,
}) => {
  // Calculate confidence score based on ratio of records for this noiseClass to total records from all houses
  const calculateConfidenceScore = (recordCount: number, totalRecordsAllHouses: number): number => {
    // Calculate ratio: number of records for this noiseClass / total records from all houseNames
    // Convert to percentage (0-100 scale)
    const recordRatioScore = totalRecordsAllHouses > 0 
      ? (recordCount / totalRecordsAllHouses) * 100 
      : 0;
    
    const confidence = recordRatioScore;
    
    // Round and ensure it's between 0 and 100
    return Math.round(Math.min(100, Math.max(0, confidence)));
  };

  // Filter out "Background noise" records
  const filteredMatches = useMemo(() => {
    return matches.filter(
      (match) => match.description.toLowerCase() !== 'background noise'
    );
  }, [matches]);

  // Group matches by houseName, then by description within each house
  const groupedMatches = useMemo(() => {
    // Use totalRecords from API (from get_house_without_label) or fallback to matches.length
    const totalRecordsAllHouses = totalRecords ?? matches.length;
    
    // First group by houseName
    const houseGroups = new Map<string, NoiseMatch[]>();
    
    filteredMatches.forEach((match) => {
      if (!houseGroups.has(match.houseName)) {
        houseGroups.set(match.houseName, []);
      }
      houseGroups.get(match.houseName)!.push(match);
    });
    
    // Then group by description within each house
    const result: GroupedMatch[] = Array.from(houseGroups.entries()).map(([houseName, records]) => {
      // Group records by description
      const descriptionGroupsMap = new Map<string, NoiseMatch[]>();
      
      records.forEach((record) => {
        const desc = record.description;
        if (!descriptionGroupsMap.has(desc)) {
          descriptionGroupsMap.set(desc, []);
        }
        descriptionGroupsMap.get(desc)!.push(record);
      });
      
      // Convert to DescriptionGroup array
      const descriptionGroups: DescriptionGroup[] = Array.from(descriptionGroupsMap.entries()).map(([description, descRecords]) => {
        // Sort records by timestamp (most recent first)
        descRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        // Calculate confidence based on ratio of records for this noiseClass to total records from all houses
        const calculatedConfidence = calculateConfidenceScore(descRecords.length, totalRecordsAllHouses);
        return { description, records: descRecords, maxConfidence: calculatedConfidence };
      });
      
      // Sort description groups by max confidence (highest first)
      descriptionGroups.sort((a, b) => b.maxConfidence - a.maxConfidence);
      
      // Calculate overall max confidence for the house
      const houseMaxConfidence = Math.max(...descriptionGroups.map(g => g.maxConfidence));
      
      return { houseName, descriptionGroups, maxConfidence: houseMaxConfidence };
    });
    
    // Sort house groups by max confidence (highest first)
    result.sort((a, b) => b.maxConfidence - a.maxConfidence);
    
    return result;
  }, [filteredMatches, totalRecords]);

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

  if (filteredMatches.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matching Noise Records Found</CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          We found {groupedMatches.length} {groupedMatches.length === 1 ? 'location' : 'locations'} with {filteredMatches.length} {filteredMatches.length === 1 ? 'record' : 'records'} from our noise monitoring system.
          Please review and select the record that matches your complaint.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {groupedMatches.map((group, index) => (
            <div
              key={group.houseName}
              className={`border rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-200 ${
                index % 2 === 0 ? 'bg-gray-50 border-gray-300' : 'bg-blue-50 border-blue-200'
              }`}
            >
              {/* Card Header with House ID and Confidence Score (fixed top-right) */}
              <div className={`relative p-5 pb-3 border-b ${
                index % 2 === 0 ? 'border-gray-300' : 'border-blue-200'
              }`}>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-base font-semibold text-gray-900">
                    {group.houseName}
                  </span>
                </div>
              </div>

              {/* Description Groups Container */}
              <div className="p-5 space-y-6">
                {group.descriptionGroups.map((descGroup, descIndex) => (
                  <div key={`${group.houseName}_${descGroup.description}_${descIndex}`}>
                    {/* Description Header */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-gray-900">{descGroup.description}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(descGroup.maxConfidence)}`}>
                          {getConfidenceLabel(descGroup.maxConfidence)} ({descGroup.maxConfidence}%)
                        </span>
                      </div>
                      {descGroup.records.length > 0 && (() => {
                        const timestamps = descGroup.records.map(r => new Date(r.timestamp).getTime());
                        const startTime = new Date(Math.min(...timestamps));
                        const endTime = new Date(Math.max(...timestamps));
                        return (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>
                              {startTime.toLocaleString('en-SG', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                              {' - '}
                              {endTime.toLocaleString('en-SG', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Scrollable Records Container */}
                    <div className="h-24 overflow-y-auto pr-2 space-y-3 mb-4">
                      {descGroup.records.map((match) => (
                        <div
                          key={match.id}
                          className={`border rounded-lg p-4 transition-colors ${
                            index % 2 === 0 
                              ? 'border-gray-200 hover:bg-gray-200' 
                              : 'border-blue-100 hover:bg-blue-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{formatTimestamp(match.timestamp)}</span>
                          </div>
                          <p className="text-sm text-gray-700">
                            Noise Detected: {match.description}
                          </p>
                        </div>
                      ))}
                    </div>
                    
                    {/* Select Button for This Description Group */}
                    <div className={`pt-4 border-t ${
                      index % 2 === 0 ? 'border-gray-200' : 'border-blue-200'
                    }`}>
                      <Button
                        variant="primary"
                        size="md"
                        fullWidth
                        onClick={() => {
                          // Combine all records for this description group
                          const timestamps = descGroup.records.map(r => new Date(r.timestamp).getTime());
                          const startTime = new Date(Math.min(...timestamps)).toISOString();
                          const endTime = new Date(Math.max(...timestamps)).toISOString();
                          
                          // Create a combined match with all records in this description group
                          const combinedMatch: NoiseMatch = {
                            id: `${group.houseName}_${descGroup.description}_combined`,
                            houseName: group.houseName,
                            timestamp: descGroup.records[0].timestamp, // Use first record's timestamp as primary
                            confidenceScore: descGroup.maxConfidence,
                            description: descGroup.description,
                            startTime: startTime,
                            endTime: endTime,
                          };
                          
                          onSelectMatch(combinedMatch);
                        }}
                      >
                        Select Record{descGroup.records.length > 1 ? `s (${descGroup.records.length})` : ''}
                      </Button>
                    </div>
                  </div>
                ))}
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
