import { useState, useCallback } from 'react';
import { FlowState } from '../types/base';

interface FlowMetrics {
  efficiency: number;
  duration: number;
  transitions: number;
}

export const useFlow = () => {
  const [currentState, setCurrentState] = useState<FlowState>(FlowState.FOCUS);
  const [metrics, setMetrics] = useState<FlowMetrics>({
    efficiency: 0.8,
    duration: 0,
    transitions: 0
  });

  const transitionTo = useCallback((newState: FlowState) => {
    setCurrentState(prevState => {
      if (prevState === newState) return prevState;
      
      setMetrics(prev => ({
        ...prev,
        transitions: prev.transitions + 1,
        efficiency: prev.efficiency * 0.9 // Slight efficiency drop on transition
      }));
      
      return newState;
    });
  }, []);

  const optimize = useCallback((targetState: FlowState) => {
    if (currentState === targetState) {
      setMetrics(prev => ({
        ...prev,
        efficiency: Math.min(1, prev.efficiency * 1.1),
        duration: prev.duration + 1
      }));
    } else {
      transitionTo(targetState);
    }
  }, [currentState, transitionTo]);

  const reset = useCallback(() => {
    setCurrentState(FlowState.FOCUS);
    setMetrics({
      efficiency: 0.8,
      duration: 0,
      transitions: 0
    });
  }, []);

  return {
    currentState,
    metrics,
    transitionTo,
    optimize,
    reset
  };
}; 