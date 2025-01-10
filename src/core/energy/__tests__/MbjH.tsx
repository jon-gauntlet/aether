import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PatternVisualization } from '../PatternVisualization';
import { usePatternLibrary } from '../../hooks/usePatternLibrary';
import { useAutonomicSystem } from '../../core/hooks/useAutonomicSystem';
import { Subject } from 'rxjs';

// Mock the hooks
jest.mock('../../hooks/usePatternLibrary');
jest.mock('../../core/hooks/useAutonomicSystem');

describe('PatternVisualization', () => {
  const mockPatterns = [
    {
      id: '1',
      name: 'Test Pattern',
      description: 'A test pattern',
      energyLevel: 0.8,
      successRate: 0.9,
      context: ['Test', 'Development'],
      states: ['ACTIVE', 'STABLE']
    }
  ];

  const mockFlow$ = new Subject();
  const mockState = {
    energy: {
      type: 'deep',
      flow: 'natural',
      level: 0.7
    },
    context: {
      depth: 0.5,
      patterns: ['Natural Flow']
    },
    protection: {
      depth: 0.6,
      patterns: ['Flow State'],
      states: ['Active']
    }
  };

  beforeEach(() => {
    (usePatternLibrary as jest.Mock).mockReturnValue({ patterns: mockPatterns });
    (useAutonomicSystem as jest.Mock).mockReturnValue({ state: mockState, flow$: mockFlow$ });
  });

  it('renders pattern nodes', () => {
    render(<PatternVisualization />);
    expect(screen.getByText('Test Pattern')).toBeInTheDocument();
  });

  it('shows pattern details when a pattern is clicked', () => {
    render(<PatternVisualization />);
    fireEvent.click(screen.getByText('Test Pattern'));
    expect(screen.getByText('A test pattern')).toBeInTheDocument();
  });

  it('updates visualization based on flow changes', () => {
    render(<PatternVisualization />);
    mockFlow$.next({
      energy: { level: 0.9, type: 'deep' },
      context: { depth: 0.8 },
      protection: { depth: 0.7 }
    });
    
    const visualization = screen.getByTestId('pattern-visualization');
    expect(visualization).toHaveAttribute('data-resonance', 'deep');
    expect(visualization).toHaveAttribute('data-flow', 'natural');
  });

  it('displays context tags', () => {
    render(<PatternVisualization />);
    fireEvent.click(screen.getByText('Test Pattern'));
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Development')).toBeInTheDocument();
  });

  it('displays pattern states', () => {
    render(<PatternVisualization />);
    fireEvent.click(screen.getByText('Test Pattern'));
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('STABLE')).toBeInTheDocument();
  });

  it('displays energy and success metrics', () => {
    render(<PatternVisualization />);
    fireEvent.click(screen.getByText('Test Pattern'));
    
    const energyBar = screen.getByTestId('energy-bar');
    const successBar = screen.getByTestId('success-bar');
    
    expect(energyBar).toHaveStyle({ width: '80%' });
    expect(successBar).toHaveStyle({ width: '90%' });
  });

  it('maintains coherent state during transitions', () => {
    render(<PatternVisualization />);
    
    // Initial state
    expect(screen.getByTestId('pattern-visualization')).toHaveAttribute('data-resonance', 'deep');
    
    // Transition to new state
    mockFlow$.next({
      energy: { level: 0.9, type: 'steady' },
      context: { depth: 0.8 },
      protection: { depth: 0.7 }
    });
    
    // Check state coherence
    expect(screen.getByTestId('pattern-visualization')).toHaveAttribute('data-resonance', 'steady');
  });

  it('preserves pattern relationships during state changes', () => {
    const { rerender } = render(<PatternVisualization />);
    
    // Select a pattern
    fireEvent.click(screen.getByText('Test Pattern'));
    expect(screen.getByText('A test pattern')).toBeInTheDocument();
    
    // Update patterns
    const newPatterns = [...mockPatterns];
    (usePatternLibrary as jest.Mock).mockReturnValue({ patterns: newPatterns });
    rerender(<PatternVisualization />);
    
    // Pattern selection should be preserved
    expect(screen.getByText('A test pattern')).toBeInTheDocument();
  });
}); 