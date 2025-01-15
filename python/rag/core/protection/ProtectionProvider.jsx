import React, { createContext, useContext } from 'react';

interface Boundaries {
  [key: string]: any;
}

interface ProtectionContextType {
  isProtected: boolean;
  boundaries: Boundaries;
  updateBoundaries: (boundaries: Boundaries) => void;
}

const ProtectionContext = createContext<ProtectionContextType | undefined>();

export const useProtection = () => {
  const context = useContext(ProtectionContext);
  if (!context) {
    throw new Error('useProtection must be used within ProtectionProvider');
  }
  return context;
};

interface ProtectionProviderProps {
  children: React.ReactNode;
  value?: ProtectionContextType;
}

export const ProtectionProvider: React.FC<ProtectionProviderProps> = ({ children, value }) => {
  const defaultValue: ProtectionContextType = value || {
    isProtected: true,
    boundaries: {},
    updateBoundaries: () => {},
  };

  return (
    <ProtectionContext.Provider value={defaultValue}>
      {children}
    </ProtectionContext.Provider>
  );
}; 