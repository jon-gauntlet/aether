import React, { createContext, useContext } from 'react';

interface EnergyContextType {
  energyLevel: number;
  coherence: number;
  updateEnergy: (level: number) => void;
}

const EnergyContext = createContext<EnergyContextType | undefined>(undefined);

export const useEnergy = () => {
  const context = useContext(EnergyContext);
  if (!context) {
    throw new Error('useEnergy must be used within EnergyProvider');
  }
  return context;
};

interface EnergyProviderProps {
  children: React.ReactNode;
  value?: EnergyContextType;
}

export const EnergyProvider: React.FC<EnergyProviderProps> = ({ children, value }) => {
  const defaultValue: EnergyContextType = value || {
    energyLevel: 1,
    coherence: 1,
    updateEnergy: () => {},
  };

  return (
    <EnergyContext.Provider value={defaultValue}>
      {children}
    </EnergyContext.Provider>
  );
}; 