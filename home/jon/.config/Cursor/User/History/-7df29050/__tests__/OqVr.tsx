import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { FlowModeSelector } from '../FlowModeSelector';
import { NaturalFlowType } from '../../core/types/base';
import { vi } from 'vitest';

describe('FlowModeSelector', () => {
  const mockOnModeChange = vi.fn();
  const modes: NaturalFlowType[] = ['natural', 'guided', 'resonant'];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all mode buttons', () => {
    const { getByText } = render(
      <FlowModeSelector currentMode="natural" onModeChange={mockOnModeChange} />
    );

    modes.forEach(mode => {
      expect(getByText(mode)).toBeInTheDocument();
    });
  });

  it('highlights active mode', () => {
    const { getByText } = render(
      <FlowModeSelector currentMode="guided" onModeChange={mockOnModeChange} />
    );

    expect(getByText('guided')).toHaveStyle({ background: 'rgba(255, 255, 255, 0.2)' });
  });

  it('calls onModeChange when clicking a mode', () => {
    const { getByText } = render(
      <FlowModeSelector currentMode="natural" onModeChange={mockOnModeChange} />
    );

    fireEvent.click(getByText('guided'));
    expect(mockOnModeChange).toHaveBeenCalledWith('guided');
  });
}); 