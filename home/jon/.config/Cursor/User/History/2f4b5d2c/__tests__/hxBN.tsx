import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { PatternVisualization } from '../PatternVisualization';
import { Pattern, PatternState } from '../../types/patterns';
import { usePatternLibrary } from '../../core/hooks/usePatternLibrary';
import { useAutonomicSystem } from '../../core/hooks/useAutonomicSystem';

// Mock the hooks
jest.mock('../../core/hooks/usePatternLibrary');
jest.mock('../../core/hooks/useAutonomicSystem');

describe('PatternVisualization', () => {
  const mockPatterns: Pattern[] = [
    {
      id: 'pattern-1',
      name: 'Test Pattern 1',
      description: 'A test pattern',
      context: ['test'],
      energyLevel: 0.7,
      successRate: 0.8,
      states: [PatternState.ACTIVE, PatternState.STABLE]
    },
    {
      id: 'pattern-2',
      name: 'Test Pattern 2',
      description: 'Another test pattern',
      context: ['test', 'flow'],
      energyLevel: 0.9,
      successRate: 0.95,
      states: [PatternState.ACTIVE, PatternState.PROTECTED]
    }
  ];

  beforeEach(() => {
    // Mock hook implementations
    (usePatternLibrary as jest.Mock).mockReturnValue({
      patterns: mockPatterns,
      addPattern: jest.fn(),
      updatePattern: jest.fn()
    });

    (useAutonomicSystem as jest.Mock).mockReturnValue({
      state: {
        energy: 0.8,
        context: 2,
        protection: 1
      }
    });
  });

  it('renders all patterns', () => {
    render(<PatternVisualization />);

    expect(screen.getByText('Test Pattern 1')).toBeInTheDocument();
    expect(screen.getByText('Test Pattern 2')).toBeInTheDocument();
  });

  it('displays pattern details on click', () => {
    render(<PatternVisualization />);

    fireEvent.click(screen.getByText('Test Pattern 1'));

    expect(screen.getByText('A test pattern')).toBeInTheDocument();
    expect(screen.getByText('Energy Level: 70%')).toBeInTheDocument();
    expect(screen.getByText('Success Rate: 80%')).toBeInTheDocument();
  });

  it('shows pattern states with appropriate styling', () => {
    render(<PatternVisualization />);

    const pattern1 = screen.getByTestId('pattern-1');
    const pattern2 = screen.getByTestId('pattern-2');

    expect(pattern1).toHaveClass('stable');
    expect(pattern2).toHaveClass('protected');
  });

  it('updates visualization based on system state', () => {
    (useAutonomicSystem as jest.Mock).mockReturnValue({
      state: {
        energy: 0.9,
        context: 3,
        protection: 2
      }
    });

    render(<PatternVisualization />);

    const container = screen.getByTestId('pattern-visualization');
    expect(container).toHaveClass('high-energy');
    expect(container).toHaveClass('deep-context');
  });

  it('displays context tags', () => {
    render(<PatternVisualization />);

    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('flow')).toBeInTheDocument();
  });

  it('shows energy and success metrics', () => {
    render(<PatternVisualization />);

    const pattern2 = screen.getByTestId('pattern-2');
    fireEvent.click(pattern2);

    expect(screen.getByText('Energy Level: 90%')).toBeInTheDocument();
    expect(screen.getByText('Success Rate: 95%')).toBeInTheDocument();
  });

  it('handles pattern selection', () => {
    const onSelect = jest.fn();
    render(<PatternVisualization onPatternSelect={onSelect} />);

    fireEvent.click(screen.getByText('Test Pattern 1'));
    expect(onSelect).toHaveBeenCalledWith(mockPatterns[0]);
  });

  it('applies appropriate classes based on pattern states', () => {
    render(<PatternVisualization />);

    mockPatterns.forEach(pattern => {
      const element = screen.getByTestId(pattern.id);
      pattern.states.forEach(state => {
        expect(element).toHaveClass(state.toLowerCase());
      });
    });
  });

  it('displays pattern metrics with correct formatting', () => {
    render(<PatternVisualization />);

    fireEvent.click(screen.getByText('Test Pattern 2'));

    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
  });
}); 