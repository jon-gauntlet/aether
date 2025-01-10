import { useState, useEffect } from 'react';
import { Pattern } from '../types/patterns';

export function usePatternLibrary() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);

  useEffect(() => {
    // In a real implementation, this would load patterns from a store/API
    // For now, we'll use mock data
    setPatterns([
      {
        id: '1',
        name: 'Natural Flow',
        description: 'Enables organic development following energy and context',
        energyLevel: 0.8,
        successRate: 0.9,
        context: ['Development', 'Flow State', 'Energy'],
        states: ['ACTIVE', 'STABLE']
      },
      {
        id: '2', 
        name: 'Deep Connection',
        description: 'Fosters genuine presence and deep understanding',
        energyLevel: 0.7,
        successRate: 0.85,
        context: ['Communication', 'Understanding', 'Presence'],
        states: ['ACTIVE', 'EVOLVING']
      },
      {
        id: '3',
        name: 'Pattern Evolution',
        description: 'Allows patterns to naturally evolve and adapt',
        energyLevel: 0.9,
        successRate: 0.75,
        context: ['Adaptation', 'Growth', 'Learning'],
        states: ['ACTIVE', 'EVOLVING']
      }
    ]);
  }, []);

  return { patterns };
} 