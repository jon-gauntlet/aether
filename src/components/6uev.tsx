import React from 'react';
import { useFlow } from './core/hooks/useFlow';
import { FlowState } from './core/types/flow';
import { PresenceType } from './core/types/stream';

interface AppProps {
  // Add any props if needed
}

const defaultFlowState: FlowState = {
  type: 'natural',
  depth: 0,
  harmony: 0,
  energy: 0,
  presence: 0,
  resonance: 0,
  coherence: 0,
  rhythm: 0
};

export const App: React.FC<AppProps> = () => {
  const flow = useFlow();
  const { stream } = flow;

  const currentFlowState = stream?.flowState && typeof stream.flowState !== 'string'
    ? stream.flowState
    : defaultFlowState;

  return (
    <div>
      <header>
        <h1>ChatGenius</h1>
      </header>
      <main>
        <div className="presence-container">
          <div className="flow-state-indicator">
            <div>Depth: {currentFlowState.depth}</div>
            <div>Harmony: {currentFlowState.harmony}</div>
            <div>Energy: {currentFlowState.energy}</div>
            <div>Presence: {currentFlowState.presence}</div>
          </div>
          {/* Add your content here */}
        </div>
      </main>
    </div>
  );
};

export default App;