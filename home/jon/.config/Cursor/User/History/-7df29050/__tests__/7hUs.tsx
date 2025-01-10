import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { FlowModeSelector } from '../FlowModeSelector';
import { NaturalFlowType } from '../../core/types/base';

describe('FlowModeSelector', () => {
  const mockOnModeChange = jest.fn();
  const modes: NaturalFlowType[] = ['natural', 'guided', 'resonant'];

  beforeEach(() => {
    mockOnModeChange.mockClear();
  });

  it('renders all mode buttons', () => {
    render(
      <FlowModeSelector
        currentMode="natural"
        onModeChange={mockOnModeChange}
      />
    );

    modes.forEach(mode => {
      expect(screen.getByText(mode)).toBeInTheDocument();
    });
  });

  it('highlights the current mode', () => {
    modes.forEach(mode => {
      render(
        <FlowModeSelector
          currentMode={mode}
          onModeChange={mockOnModeChange}
        />
      );

      const button = screen.getByText(mode);
      expect(button).toHaveStyle({ background: 'rgba(255, 255, 255, 0.2)' });

      // Other buttons should not be highlighted
      modes
        .filter(m => m !== mode)
        .forEach(otherMode => {
          const otherButton = screen.getByText(otherMode);
          expect(otherButton).toHaveStyle({ background: 'rgba(255, 255, 255, 0.1)' });
        });
    });
  });

  it('calls onModeChange when clicking buttons', () => {
    render(
      <FlowModeSelector
        currentMode="natural"
        onModeChange={mockOnModeChange}
      />
    );

    modes.forEach(mode => {
      fireEvent.click(screen.getByText(mode));
      expect(mockOnModeChange).toHaveBeenCalledWith(mode);
    });

    expect(mockOnModeChange).toHaveBeenCalledTimes(modes.length);
  });

  it('applies hover styles on mouse over', () => {
    render(
      <FlowModeSelector
        currentMode="natural"
        onModeChange={mockOnModeChange}
      />
    );

    modes.forEach(mode => {
      const button = screen.getByText(mode);
      fireEvent.mouseOver(button);
      expect(button).toHaveStyle({ background: 'rgba(255, 255, 255, 0.25)' });
    });
  });
}); 