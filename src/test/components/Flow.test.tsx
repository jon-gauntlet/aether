import React from 'react';
import { render, screen } from '../utils/test-utils';
import { FlowComponent } from '@/components/Flow';

describe('FlowComponent', () => {
  it('renders with default props', () => {
    render(<FlowComponent />);
    expect(screen.getByTestId('flow-container')).toBeInTheDocument();
  });

  it('applies flow styles when in flow state', () => {
    const { container } = render(<FlowComponent isInFlow={true} flowIntensity={85} />);
    expect(container.firstChild).toHaveStyle({
      opacity: 0.8,
      transform: expect.stringContaining('scale(1)')
    });
  });

  it('displays flow intensity', () => {
    render(<FlowComponent isInFlow={true} flowIntensity={85} />);
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('Flow Intensity')).toBeInTheDocument();
  });

  it('responds to natural resonance', () => {
    const { container } = render(<FlowComponent isInFlow={true} naturalResonance={1.5} />);
    expect(container.firstChild).toHaveStyle({
      animation: expect.stringContaining('flowAnimation')
    });
  });
});