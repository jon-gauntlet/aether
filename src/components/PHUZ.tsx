import React, { createContext, useRef } from 'react';
import { PatternLibrary } from '../autonomic/PatternLibrary';
import { PatternLibrary as IPatternLibrary } from '../types/autonomic';

export const PatternLibraryContext = createContext<IPatternLibrary | null>(null);

interface Props {
  children: React.ReactNode;
}

export function PatternLibraryProvider({ children }: Props) {
  const libraryRef = useRef<IPatternLibrary>(new PatternLibrary());

  return (
    <PatternLibraryContext.Provider value={libraryRef.current}>
      {children}
    </PatternLibraryContext.Provider>
  );
} 