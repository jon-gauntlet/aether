import React from 'react';
import { render } from '@testing-library/react';
import { PatternVisualization } from '../PatternVisualization';
import { usePatternLibrary } from '../../core/hooks/usePatternLibrary';
import { useAutonomicSystem } from '../../core/hooks/useAutonomicSystem';
import { vi } from 'vitest';

vi.mock('../../core/hooks/usePatternLibrary');
vi.mock('../../core/hooks/useAutonomicSystem');

const mockPatterns = [
  {
    id: 'pattern-1',
    metrics: {
      coherence: { current: 0.8, history: [0.7, 0.8] },
      stability: { current: 0.7, history: [0.6, 0.7] },
      evolution: { current: 0.6, history: [0.5, 0.6] },
      quality: 0.75
    },
    context: ['flow', 'test'],
    states: ['stable']
  }
];

const mockSystem = {
  energy: 0.8,
  coherence: 0.7,
  stability: 0.9
};

describe('PatternVisualization', () => {
  beforeEach(() => {
    (usePatternLibrary as any).mockReturnValue({ patterns: mockPatterns });
    (useAutonomicSystem as any).mockReturnValue({ metrics: mockSystem });
  });

  it('renders pattern metrics', () => {
    const { getByText } = render(<PatternVisualization />);
    
    expect(getByText(/Coherence: 80%/)).toBeInTheDocument();
    expect(getByText(/Stability: 70%/)).toBeInTheDocument();
    expect(getByText(/Evolution: 60%/)).toBeInTheDocument();
  });

  it('renders system metrics', () => {
    const { getByText } = render(<PatternVisualization />);
    
    expect(getByText(/Energy: 80%/)).toBeInTheDocument();
    expect(getByText(/System Coherence: 70%/)).toBeInTheDocument();
    expect(getByText(/System Stability: 90%/)).toBeInTheDocument();
  });
}); 