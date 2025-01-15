import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FlowModeSelector } from '../FlowModeSelector';

describe('FlowModeSelector', () => {
  const modes = ['Natural', 'Guided', 'Resonant'];
  
  it('renders mode buttons', () => {
    render(
      <FlowModeSelector
        currentMode="Natural"
        onSelect={() => {}}
      />
    );

    modes.forEach(mode => {
      expect(screen.getByText(mode)).toBeInTheDocument();
    });
  });

  it('highlights current mode', () => {
    render(
      <FlowModeSelector
        currentMode="Guided"
        onSelect={() => {}}
      />
    );

    const guidedButton = screen.getByText('Guided');
    expect(guidedButton).toHaveStyle({
      background: 'rgba(0, 123, 255, 0.2)'
    });
  });

  it('calls onSelect when mode is clicked', () => {
    const mockOnSelect = vi.fn();
    render(
      <FlowModeSelector
        currentMode="Natural"
        onSelect={mockOnSelect}
      />
    );

    fireEvent.click(screen.getByText('Guided'));
    expect(mockOnSelect).toHaveBeenCalledWith('Guided');
  });
}); 