import React from 'react';
import { FlowState } from '../types/base';

interface FlowModeSelectorProps {
  currentState: FlowState;
  onStateChange: (newState: FlowState) => void;
}

export const FlowModeSelector: React.FC<FlowModeSelectorProps> = ({
  currentState,
  onStateChange
}) => {
  const toggleFlow = () => {
    onStateChange({
      ...currentState,
      active: !currentState.active
    });
  };

  const adjustDepth = (increment: number) => {
    onStateChange({
      ...currentState,
      depth: Math.max(0, currentState.depth + increment)
    });
  };

  const toggleProtection = () => {
    onStateChange({
      ...currentState,
      protected: !currentState.protected
    });
  };

  return (
    <div className="flow-mode-selector">
      <div className="flow-status">
        <span>{currentState.active ? 'Flow Active' : 'Flow Inactive'}</span>
        <span>Depth: {currentState.depth}</span>
      </div>

      <div className="flow-controls">
        <button
          role="switch"
          aria-checked={currentState.active}
          onClick={toggleFlow}
        >
          Toggle Flow
        </button>

        <button
          aria-label="Increase Depth"
          onClick={() => adjustDepth(1)}
        >
          +
        </button>

        <button
          aria-label="Decrease Depth"
          onClick={() => adjustDepth(-1)}
        >
          -
        </button>

        <button
          aria-label="Toggle Protection"
          onClick={toggleProtection}
        >
          {currentState.protected ? 'Protected' : 'Unprotected'}
        </button>
      </div>
    </div>
  );
}; 