import React, { createContext, useEffect, useState } from 'react';
import { EnergySystem } from '../energy/EnergySystem';

export const EnergySystemContext = createContext<EnergySystem | null>(null);

interface EnergySystemProviderProps {
  children: React.ReactNode;
}

export const EnergySystemProvider: React.FC<EnergySystemProviderProps> = ({ children }) => {
  const [energySystem] = useState<EnergySystem>(() => new EnergySystem());

  useEffect(() => {
    // Initialize system
    const subscription = energySystem.getFlowState().subscribe();
    return () => subscription.unsubscribe();
  }, [energySystem]);

  return (
    <EnergySystemContext.Provider value={energySystem}>
      {children}
    </EnergySystemContext.Provider>
  );
}; 