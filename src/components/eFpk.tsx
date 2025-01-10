import React, { createContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Pattern, PatternContextType, PatternProviderProps } from '../types/patterns';

export const PatternContext = createContext<PatternContextType | undefined>(undefined);

export const PatternProvider: React.FC<PatternProviderProps> = ({ children }) => {
  const [patterns, setPatterns] = useState<Pattern[]>([]);

  const addPattern = useCallback((pattern: Omit<Pattern, 'id'>) => {
    const newPattern: Pattern = {
      ...pattern,
      id: uuidv4()
    };
    setPatterns(current => [...current, newPattern]);
  }, []);

  const removePattern = useCallback((id: string) => {
    setPatterns(current => current.filter(p => p.id !== id));
  }, []);

  const evolvePattern = useCallback((id: string) => {
    setPatterns(current => current.map(pattern => {
      if (pattern.id === id) {
        return {
          ...pattern,
          strength: pattern.strength + 1,
          evolution: {
            stage: pattern.evolution.stage + 1,
            history: [...pattern.evolution.history, `Evolved at ${new Date().toISOString()}`]
          }
        };
      }
      return pattern;
    }));
  }, []);

  return (
    <PatternContext.Provider
      value={{
        activePatterns: patterns,
        addPattern,
        removePattern,
        evolvePattern
      }}
    >
      {children}
    </PatternContext.Provider>
  );
}; 