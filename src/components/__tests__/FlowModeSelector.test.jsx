import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FlowModeSelector } from '../FlowModeSelector';

const FLOW_STATES = {
  FOCUS: 'FOCUS',
  FLOW: 'FLOW',
  HYPERFOCUS: 'HYPERFOCUS',
  RECOVERING: 'RECOVERING',
  EXHAUSTED: 'EXHAUSTED',
  DISTRACTED: 'DISTRACTED'
};

const DEFAULT_METRICS = {
  velocity: 0.8,
  momentum: 0.7,
  resistance: 0.2,
  conductivity: 0.9
};

const createFlowState = (type) => ({
  active: true,
  type,
  intensity: 'medium',
  duration: 0,
  metrics: DEFAULT_METRICS,
  lastTransition: Date.now(),
  protected: false,
  quality: 0.8
});

describe('FlowModeSelector', () => {
  const mockOnSelect = jest.fn();
  const stateTypes = [
    FLOW_STATES.FOCUS,
    FLOW_STATES.FLOW,
    FLOW_STATES.HYPERFOCUS,
    FLOW_STATES.RECOVERING,
    FLOW_STATES.EXHAUSTED,
    FLOW_STATES.DISTRACTED
  ];

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  it('renders all state buttons', () => {
    const { getByText } = render(
      <FlowModeSelector
        currentState={createFlowState(FLOW_STATES.FOCUS)}
        onSelect={mockOnSelect}
      />
    );

    stateTypes.forEach(stateType => {
      expect(getByText(stateType)).toBeInTheDocument();
    });
  });

  it('highlights the current state', () => {
    stateTypes.forEach(stateType => {
      const { getByText } = render(
        <FlowModeSelector
          currentState={createFlowState(stateType)}
          onSelect={mockOnSelect}
        />
      );

      const button = getByText(stateType);
      expect(button).toHaveStyle({ 
        background: expect.stringContaining('linear-gradient'),
        transform: 'scale(1.05)'
      });

      stateTypes
        .filter(s => s !== stateType)
        .forEach(otherType => {
          const otherButton = getByText(otherType);
          expect(otherButton).toHaveStyle({ 
            background: 'rgba(255, 255, 255, 0.1)',
            transform: 'scale(1)'
          });
        });
    });
  });

  it('calls onSelect when clicking buttons', () => {
    const initialState = createFlowState(FLOW_STATES.FOCUS);
    const { getByText } = render(
      <FlowModeSelector
        currentState={initialState}
        onSelect={mockOnSelect}
      />
    );

    stateTypes.forEach(stateType => {
      const button = getByText(stateType);
      if (!button.hasAttribute('disabled')) {
        fireEvent.click(button);
        expect(mockOnSelect).toHaveBeenCalledWith({
          ...initialState,
          type: stateType,
          lastTransition: expect.any(Number)
        });
      }
    });
  });

  it('disables hyperfocus when not in flow state', () => {
    const { getByText } = render(
      <FlowModeSelector
        currentState={createFlowState(FLOW_STATES.FOCUS)}
        onSelect={mockOnSelect}
      />
    );

    const hyperfocusButton = getByText(FLOW_STATES.HYPERFOCUS);
    expect(hyperfocusButton).toBeDisabled();
  });

  it('enables hyperfocus when in flow state', () => {
    const { getByText } = render(
      <FlowModeSelector
        currentState={createFlowState(FLOW_STATES.FLOW)}
        onSelect={mockOnSelect}
      />
    );

    const hyperfocusButton = getByText(FLOW_STATES.HYPERFOCUS);
    expect(hyperfocusButton).not.toBeDisabled();
  });

  it('disables all buttons during cooldown', () => {
    const { container } = render(
      <FlowModeSelector
        currentState={createFlowState(FLOW_STATES.FOCUS)}
        onSelect={mockOnSelect}
        cooldown={true}
      />
    );

    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });
}); 