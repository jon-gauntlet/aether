import React, { createContext, useContext } from 'react';
import { BehaviorSubject } from 'rxjs';
import { FlowState, FlowMetrics } from '../types/base';

interface EnergySystem {
  state$: BehaviorSubject<FlowState>;
  metrics$: BehaviorSubject<FlowMetrics>;
}

const defaultMetrics: FlowMetrics = {
  intensity: 0,
  resonance: 0,
  harmony: 0,
  rhythm: 0,
  depth: 0,
  presence: 0,
  alignment: 0,
  clarity: 0,
  stability: 0,
  coherence: 0,
  quality: 0
};

const defaultState: FlowState = {
  id: 'default',
  type: 'natural',
  metrics: defaultMetrics,
  protection: {
    level: 0,
    type: 'natural',
    strength: 0,
    resilience: 0,
    adaptability: 0,
    field: {
      center: { x: 0, y: 0, z: 0 },
      radius: 0,
      strength: 0,
      coherence: 0,
      stability: 0,
      waves: []
    },
    natural: true
  },
  patterns: [],
  timestamp: Date.now()
};

const defaultSystem: EnergySystem = {
  state$: new BehaviorSubject<FlowState>(defaultState),
  metrics$: new BehaviorSubject<FlowMetrics>(defaultMetrics)
};

const EnergySystemContext = createContext<EnergySystem>(defaultSystem);

export const useEnergySystem = () => {
  const context = useContext(EnergySystemContext);
  if (!context) {
    throw new Error('useEnergySystem must be used within an EnergySystemProvider');
  }
  return context;
};

interface EnergySystemProviderProps {
  children: React.ReactNode;
  initialState?: FlowState;
  initialMetrics?: FlowMetrics;
}

export const EnergySystemProvider: React.FC<EnergySystemProviderProps> = ({
  children,
  initialState = defaultState,
  initialMetrics = defaultMetrics
}) => {
  const system: EnergySystem = {
    state$: new BehaviorSubject<FlowState>(initialState),
    metrics$: new BehaviorSubject<FlowMetrics>(initialMetrics)
  };

  return (
    <EnergySystemContext.Provider value={system}>
      {children}
    </EnergySystemContext.Provider>
  );
}; 