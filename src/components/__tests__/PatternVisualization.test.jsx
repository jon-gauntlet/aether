import { render, fireEvent, screen } from '@testing-library/react';
import { PatternVisualization } from '../PatternVisualization';
import { Pattern, PatternMatch } from '../../core/autonomic/PatternSystem';

describe('PatternVisualization', () => {
  const mockPatterns: PatternMatch[] = [
    {
      pattern: {
        id: 'flow_pattern',
        name: 'Flow Pattern',
        conditions: {
          minFieldStrength: 0.7,
          minResonance: 0.6
        },
        weight: 1.0,
        activations: 5
      },
      confidence: 0.8,
      matchedConditions: ['fieldStrength', 'resonance']
    },
    {
      pattern: {
        id: 'focus_pattern',
        name: 'Focus Pattern',
        conditions: {
          minFieldStrength: 0.8,
          maxResistance: 0.3
        },
        weight: 0.9,
        activations: 3
      },
      confidence: 0.7,
      matchedConditions: ['fieldStrength']
    }
  ];

  it('should render pattern cards', () => {
    render(<PatternVisualization patterns={mockPatterns} />);

    expect(screen.getByText('Flow Pattern')).toBeInTheDocument();
    expect(screen.getByText('Focus Pattern')).toBeInTheDocument();
  });

  it('should display pattern confidence', () => {
    render(<PatternVisualization patterns={mockPatterns} />);

    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
  });

  it('should show pattern details on hover', async () => {
    render(<PatternVisualization patterns={mockPatterns} />);

    const flowPattern = screen.getByText('Flow Pattern').closest('div');
    fireEvent.mouseEnter(flowPattern!);

    expect(await screen.findByText('Activations: 5')).toBeInTheDocument();
    expect(await screen.findByText('Weight: 1')).toBeInTheDocument();
  });

  it('should highlight matched conditions', () => {
    render(<PatternVisualization patterns={mockPatterns} />);

    const conditions = screen.getAllByTestId('condition-indicator');
    expect(conditions[0]).toHaveStyle({ background: expect.stringContaining('linear-gradient') });
  });

  it('should sort patterns by confidence', () => {
    render(<PatternVisualization patterns={mockPatterns} />);

    const patterns = screen.getAllByTestId('pattern-card');
    expect(patterns[0]).toHaveTextContent('Flow Pattern');
    expect(patterns[1]).toHaveTextContent('Focus Pattern');
  });

  it('should show empty state when no patterns', () => {
    render(<PatternVisualization patterns={[]} />);

    expect(screen.getByText('No active patterns')).toBeInTheDocument();
  });

  it('should handle pattern selection', () => {
    const onSelect = jest.fn();
    render(
      <PatternVisualization
        patterns={mockPatterns}
        onPatternSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByText('Flow Pattern'));
    expect(onSelect).toHaveBeenCalledWith(mockPatterns[0].pattern);
  });

  it('should animate pattern strength', () => {
    const { rerender } = render(
      <PatternVisualization patterns={mockPatterns} />
    );

    const updatedPatterns = [
      {
        ...mockPatterns[0],
        confidence: 0.9
      }
    ];

    rerender(<PatternVisualization patterns={updatedPatterns} />);

    const strengthIndicator = screen.getByTestId('strength-indicator-flow_pattern');
    expect(strengthIndicator).toHaveStyle({ transition: expect.stringContaining('width') });
  });

  it('should filter patterns by threshold', () => {
    render(
      <PatternVisualization
        patterns={mockPatterns}
        confidenceThreshold={0.75}
      />
    );

    expect(screen.getByText('Flow Pattern')).toBeInTheDocument();
    expect(screen.queryByText('Focus Pattern')).not.toBeInTheDocument();
  });
}); 