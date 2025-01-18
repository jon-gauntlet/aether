import { useState, useEffect } from 'react';
import { AutonomicSystem } from './AutonomicSystem';

/**
 * @typedef {Object} AutonomicHook
 * @property {Object} state - Current autonomic state
 * @property {Function} updateState - Function to update state
 * @property {Function} getRecommendations - Function to get recommendations
 */

/**
 * Hook for accessing autonomic system functionality
 * @returns {AutonomicHook} The autonomic hook interface
 */
function useAutonomic() {
  const [system] = useState(() => new AutonomicSystem());
  const [state, setState] = useState(system.state);

  useEffect(() => {
    // Subscribe to system state changes
    const unsubscribe = system.subscribe(newState => {
      setState(newState);
    });
    return unsubscribe;
  }, [system]);

  const updateState = newState => {
    system.updateState(newState);
  };

  const getRecommendations = context => {
    return system.getRecommendedActions(context);
  };

  return {
    state,
    updateState,
    getRecommendations
  };
}

export { useAutonomic };