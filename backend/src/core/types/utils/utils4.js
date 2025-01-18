import { useState } from 'react';

/**
 * @typedef {Object.<string, any>} UseEnergy
 */

/**
 * Custom hook for managing energy state
 * @returns {{energy: any, setEnergy: Function}}
 */
export const useEnergy = () => {
  const [energy, setEnergy] = useState(null);
  return { energy, setEnergy };
};