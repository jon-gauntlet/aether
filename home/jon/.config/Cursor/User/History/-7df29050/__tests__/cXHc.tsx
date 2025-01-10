import { render, fireEvent } from '@testing-library/react';
import { FlowModeSelector } from '../FlowModeSelector';
import { FlowState } from '../../core/types/base';

describe('FlowModeSelector', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  it('should render all flow state options', () => {
    const { getByText } = render(
      <FlowModeSelector
        currentState={FlowState.FOCUS}
        onSelect={mockOnSelect}
      />
    );

    expect(getByText('Focus')).toBeInTheDocument();
    expect(getByText('Flow')).toBeInTheDocument();
    expect(getByText('Hyperfocus')).toBeInTheDocument();
  });

  it('should highlight the current state', () => {
    const { getByText } = render(
      <FlowModeSelector
        currentState={FlowState.FLOW}
        onSelect={mockOnSelect}
      />
    );

    const flowButton = getByText('Flow').closest('button');
    expect(flowButton).toHaveStyle({
      background: expect.stringContaining('linear-gradient')
    });
  });

  it('should call onSelect when a state is selected', () => {
    const { getByText } = render(
      <FlowModeSelector
        currentState={FlowState.FOCUS}
        onSelect={mockOnSelect}
      />
    );

    fireEvent.click(getByText('Flow'));
    expect(mockOnSelect).toHaveBeenCalledWith(FlowState.FLOW);
  });

  it('should disable exhausted state when in recovery', () => {
    const { getByText } = render(
      <FlowModeSelector
        currentState={FlowState.RECOVERING}
        onSelect={mockOnSelect}
      />
    );

    const exhaustedButton = getByText('Exhausted').closest('button');
    expect(exhaustedButton).toBeDisabled();
  });

  it('should show recovery progress when recovering', () => {
    const { getByRole } = render(
      <FlowModeSelector
        currentState={FlowState.RECOVERING}
        onSelect={mockOnSelect}
        recoveryProgress={0.5}
      />
    );

    const progressBar = getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  it('should disable state transitions during cooldown', () => {
    const { getByText } = render(
      <FlowModeSelector
        currentState={FlowState.FLOW}
        onSelect={mockOnSelect}
        cooldown={true}
      />
    );

    const hyperfocusButton = getByText('Hyperfocus').closest('button');
    expect(hyperfocusButton).toBeDisabled();
  });

  it('should show tooltip on hover', async () => {
    const { getByText, findByText } = render(
      <FlowModeSelector
        currentState={FlowState.FOCUS}
        onSelect={mockOnSelect}
      />
    );

    const focusButton = getByText('Focus');
    fireEvent.mouseEnter(focusButton);

    const tooltip = await findByText('Balanced productivity state');
    expect(tooltip).toBeInTheDocument();
  });

  it('should animate state transitions', () => {
    const { getByText, rerender } = render(
      <FlowModeSelector
        currentState={FlowState.FOCUS}
        onSelect={mockOnSelect}
      />
    );

    const initialButton = getByText('Focus').closest('button');
    const initialTransform = window.getComputedStyle(initialButton!).transform;

    rerender(
      <FlowModeSelector
        currentState={FlowState.FLOW}
        onSelect={mockOnSelect}
      />
    );

    const updatedButton = getByText('Flow').closest('button');
    expect(updatedButton).toHaveStyle({
      transition: expect.stringContaining('transform')
    });
  });
}); 