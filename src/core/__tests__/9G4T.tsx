import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FlowModeSelector } from '../FlowModeSelector';
import { NaturalFlowType } from '../../core/types/base';

describe('FlowModeSelector', () => {
  const mockOnModeChange = jest.fn();
  const modes: NaturalFlowType[] = ['natural', 'guided', 'resonant'];

  beforeEach(() => {
    mockOnModeChange.mockClear();
  });

  it('renders all mode buttons', () => {
    const { getByText } = render(
      <FlowModeSelector
        currentMode="natural"
        onModeChange={mockOnModeChange}
      />
    );

    modes.forEach(mode => {
      expect(getByText(mode)).toBeInTheDocument();
    });
  });

  it('highlights the current mode', () => {
    modes.forEach(mode => {
      const { getByText } = render(
        <FlowModeSelector
          currentMode={mode}
          onModeChange={mockOnModeChange}
        />
      );

      const button = getByText(mode);
      expect(button).toHaveStyle({ background: 'rgba(255, 255, 255, 0.2)' });

      // Other buttons should not be highlighted
      modes
        .filter(m => m !== mode)
        .forEach(otherMode => {
          const otherButton = getByText(otherMode);
          expect(otherButton).toHaveStyle({ background: 'rgba(255, 255, 255, 0.1)' });
        });
    });
  });

  it('calls onModeChange when clicking buttons', async () => {
    const { getByText } = render(
      <FlowModeSelector
        currentMode="natural"
        onModeChange={mockOnModeChange}
      />
    );

    for (const mode of modes) {
      await userEvent.click(getByText(mode));
      expect(mockOnModeChange).toHaveBeenCalledWith(mode);
    }

    expect(mockOnModeChange).toHaveBeenCalledTimes(modes.length);
  });

  it('applies hover styles on mouse over', async () => {
    const { getByText } = render(
      <FlowModeSelector
        currentMode="natural"
        onModeChange={mockOnModeChange}
      />
    );

    for (const mode of modes) {
      const button = getByText(mode);
      await userEvent.hover(button);
      expect(button).toHaveStyle({ background: 'rgba(255, 255, 255, 0.25)' });
    }
  });
}); 