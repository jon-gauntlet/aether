import React, { createContext, useContext } from 'react';

/**
 * @typedef {Object} EnergyContextType
 * @property {number} energyLevel - Current energy level
 * @property {number} coherence - Current coherence level
 * @property {Function} updateEnergy - Function to update energy level
 */

const EnergyContext = createContext(/** @type {EnergyContextType} */ ({
  energyLevel: 1,
  coherence: 1,
  updateEnergy: () => {}
}));

export const EnergyProvider = ({ children }) => {
  const [energyLevel, setEnergyLevel] = React.useState(1);
  const [coherence, setCoherence] = React.useState(1);

  const updateEnergy = React.useCallback((level) => {
    setEnergyLevel(Math.max(0, Math.min(100, level)));
    // Update coherence based on energy level changes
    setCoherence(level > 50 ? 1 : 0.5);
  }, []);

  const value = React.useMemo(() => ({
    energyLevel,
    coherence,
    updateEnergy
  }), [energyLevel, coherence, updateEnergy]);

  return (
    <EnergyContext.Provider value={value}>
      {children}
    </EnergyContext.Provider>
  );
};

export const useEnergy = () => {
  const context = useContext(EnergyContext);
  if (context === undefined) {
    throw new Error('useEnergy must be used within an EnergyProvider');
  }
  return context;
}; 