import React from 'react';
import { render } from '@testing-library/react';
import { FlowStateIndicator } from '../FlowStateIndicator';
import { FlowMetrics } from '../../core/types/base';

describe('FlowStateIndicator', () => {
  const mockMetrics: FlowMetrics = {
    depth: 0.8,
    harmony: 0.8,
    energy: 0.8,
    presence: 0.8,
    resonance: 0.8,
    coherence: 0.9,
    rhythm: 0.8,
  };

  it('renders nothing when no state is provided', () => {
    const { container } = render(<FlowStateIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('renders flow coherence when state is provided', () => {
    const { getByText } = render(
      <FlowStateIndicator state={mockMetrics} />
    );

    expect(getByText('Flow: 0.90')).toBeInTheDocument();
  });

  it('formats coherence value to 2 decimal places', () => {
    const metrics = {
      ...mockMetrics,
      coherence: 0.8888888
    };

    const { getByText } = render(
      <FlowStateIndicator state={metrics} />
    );

    expect(getByText('Flow: 0.89')).toBeInTheDocument();
  });

  it('applies correct styling', () => {
    const { container } = render(
      <FlowStateIndicator state={mockMetrics} />
    );

    const element = container.firstChild;
    expect(element).toHaveStyle({
      padding: '0.5rem 1rem',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '4px',
      color: 'white'
    });
  });
}); 