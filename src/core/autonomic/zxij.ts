import { useContext } from 'react';
import { PatternManagerContext } from '../context/PatternManagerContext';
import { PatternManager } from '../types/autonomic';

export function usePatternManager(): PatternManager {
  const manager = useContext(PatternManagerContext);
  if (!manager) {
    throw new Error('usePatternManager must be used within a PatternManagerProvider');
  }
  return manager;
} 