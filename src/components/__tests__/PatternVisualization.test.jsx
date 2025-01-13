import { render, screen } from '@testing-library/react';
import { PatternVisualization } from '../PatternVisualization';

describe('PatternVisualization', () => {
  const mockPattern = {
    nodes: [
      { position: { x: 0, y: 0 } },
      { position: { x: 0.5, y: 0.5 } }
    ],
    connections: [
      { source: 0, target: 1 }
    ],
    activations: 5,
    strength: 0.8,
    resonance: 0.7,
    metrics: {
      coherence: { current: 0.9 },
      stability: { current: 0.85 }
    }
  };

  it('renders without crashing', () => {
    render(<PatternVisualization pattern={mockPattern} isActive={true} />);
    expect(screen.getByText('Pattern Visualization')).toBeInTheDocument();
  });

  it('displays correct metrics', () => {
    render(<PatternVisualization pattern={mockPattern} isActive={true} />);
    expect(screen.getByText(/Strength:/)).toBeInTheDocument();
    expect(screen.getByText(/Coherence:/)).toBeInTheDocument();
    expect(screen.getByText(/Stability:/)).toBeInTheDocument();
    expect(screen.getByText(/Resonance:/)).toBeInTheDocument();
  });

  it('shows activation count', () => {
    render(<PatternVisualization pattern={mockPattern} isActive={true} />);
    expect(screen.getByText(/Activations: 5/)).toBeInTheDocument();
  });
}); 