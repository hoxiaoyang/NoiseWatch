// Mock data for testing the application
import { NoiseMatch } from '../types';

export const generateMockMatches = (): NoiseMatch[] => {
  return [
    {
      id: 'match-1',
      houseName: 'house_124',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      confidenceScore: 95,
      description: 'High-decibel noise detected: Loud music and bass sounds recorded by multiple sensors in the vicinity.',
    },
    {
      id: 'match-2',
      houseName: 'house_123',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      confidenceScore: 78,
      description: 'Moderate noise levels detected: Elevated sound patterns consistent with renovation work or furniture movement.',
    },
    {
      id: 'match-3',
      houseName: 'house_125',
      timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(), // 1.5 hours ago
      confidenceScore: 88,
      description: 'Significant noise spike detected: Shouting or loud verbal altercation patterns identified by acoustic analysis.',
    },
  ];
};
