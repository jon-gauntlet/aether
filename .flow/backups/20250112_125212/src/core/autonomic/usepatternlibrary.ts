import { useContext } from 'react';
import { PatternLibraryContext } from '../context/PatternLibraryContext';
import { PatternLibrary } from '../types/autonomic';

export function usePatternLibrary(): PatternLibrary {
  const library = useContext(PatternLibraryContext);
  if (!library) {
    throw new Error('usePatternLibrary must be used within a PatternLibraryProvider');
  }
  return library;
} 