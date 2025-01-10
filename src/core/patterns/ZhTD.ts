import { useContext } from 'react';
import { PatternContext } from '../providers/PatternProvider';
import { Pattern } from '../types/patterns';

export const usePatternContext = () => {
  const context = useContext(PatternContext);

  if (!context) {
    throw new Error('usePatternContext must be used within a PatternProvider');
  }

  const {
    activePatterns,
    addPattern,
    removePattern,
    evolvePattern
  } = context;

  return {
    activePatterns,
    addPattern,
    removePattern,
    evolvePattern
  };
}; 