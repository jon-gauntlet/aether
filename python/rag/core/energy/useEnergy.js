import { useState, useEffect, useCallback } from 'react';

/**
 * @typedef {'physical' | 'mental' | 'emotional'} EnergyType
 */

/**
 * @type {Object.<string, EnergyType>}
 */
export const ENERGY_TYPES = {
  PHYSICAL: 'physical',
  MENTAL: 'mental',
  EMOTIONAL: 'emotional'
};

/**
 * @typedef {Object} EnergyState
 * @property {number} energyLevel
 * @property {EnergyType} type
 * @property {boolean} isActive
 */

/**
 * @param {EnergyState} [initialState]
 */
export const useEnergy = (initialState = {
  energyLevel: 100,
  type: ENERGY_TYPES.PHYSICAL,
  isActive: true
}) => {
  const [energyLevel, setEnergyLevel] = useState(initialState.energyLevel);
  const [type, setType] = useState(initialState.type);
  const [isActive, setIsActive] = useState(initialState.isActive);

  const updateEnergyLevel = useCallback((level) => {
    setEnergyLevel(level);
  }, []);

  const toggleActive = useCallback(() => {
    setIsActive(prev => !prev);
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const regenerationInterval = setInterval(() => {
      setEnergyLevel(prev => Math.min(100, prev + 5));
    }, 5000);

    return () => clearInterval(regenerationInterval);
  }, [isActive]);

  return {
    energyLevel,
    type,
    isActive,
    updateEnergyLevel,
    setType,
    toggleActive
  };
}; 