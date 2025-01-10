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

  const handlePresenceUpdate = (type: PresenceType) => {
    flow.updatePresence(type);
  };

  return (
    <div>
      <header>
        <h1>ChatGenius</h1>
      </header>
      <main>
        <div
          className="presence-container"
          flowState={stream?.flowState || defaultFlowState}
        >
          {/* Add your content here */}
        </div>
      </main>
    </div>
  );
};