
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FlowModeSelector } from '../FlowModeSelector';
import { FlowState, FlowStateType, FlowIntensity } from '../../core/types/flow/types';
import { DEFAULT_FLOW_METRICS } from '../../core/types/flow/metrics';

const createFlowState = (type: FlowStateType): FlowState => ({
  active: true,
  type,
  intensity: 'medium' as FlowIntensity,
  duration: 0,
  metrics: DEFAULT_FLOW_METRICS,
  lastTransition: Date.now(),
  protected: false,
  quality: 0.8
});

describe('FlowModeSelector', () => {
  const mockOnSelect = jest.fn();
  const stateTypes = [
    FlowStateType.FOCUS,
    FlowStateType.FLOW,
    FlowStateType.HYPERFOCUS,
    FlowStateType.RECOVERING,
    FlowStateType.EXHAUSTED,
    FlowStateType.DISTRACTED
  ];

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  it('renders all state buttons', () => {
    const { getByText } = render(
      <FlowModeSelector
        currentState={createFlowState(FlowStateType.FOCUS)}
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
        background: 'linear-gradient(135deg, #00f260 0%, #0575e6 100%)',
        transform: 'scale(1.05)'
      });

      // Other buttons should not be highlighted
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

  it('calls onSelect when clicking buttons', async () => {
    const initialState = createFlowState(FlowStateType.FOCUS);
    const { getByText } = render(
      <FlowModeSelector
        currentState={initialState}
        onSelect={mockOnSelect}
      />
    );

    for (const stateType of stateTypes) {
      const button = getByText(stateType);
      if (!button.hasAttribute('disabled')) {
        await userEvent.click(button);
        expect(mockOnSelect).toHaveBeenCalledWith({
          ...initialState,
          type: stateType,
          lastTransition: expect.any(Number)
        });
      }
    }
  });

  it('disables hyperfocus when not in flow state', () => {
    const { getByText } = render(
      <FlowModeSelector
        currentState={createFlowState(FlowStateType.FOCUS)}
        onSelect={mockOnSelect}
      />
    );

    const hyperfocusButton = getByText(FlowStateType.HYPERFOCUS);
    expect(hyperfocusButton).toBeDisabled();
  });

  it('enables hyperfocus when in flow state', () => {
    const { getByText } = render(
      <FlowModeSelector
        currentState={createFlowState(FlowStateType.FLOW)}
        onSelect={mockOnSelect}
      />
    );

    const hyperfocusButton = getByText(FlowStateType.HYPERFOCUS);
    expect(hyperfocusButton).not.toBeDisabled();
  });

  it('shows recovery progress bar when recovering', () => {
    const { getByRole } = render(
      <FlowModeSelector
        currentState={createFlowState(FlowStateType.RECOVERING)}
        onSelect={mockOnSelect}
        recoveryProgress={0.5}
      />
    );

    const progressBar = getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  it('disables all buttons during coiner } = render(
      <FlowModeSelector
;,
        onSelect={mockOnSelect},
cooldown={true};,
      /> undefined
    ); undefined;

    const buttons = container.querySelectorAll('button');
    buttons.forEach((button: HTMLButtonElement) => {
      expect(button).toBeDisabled();
    });
  });
});