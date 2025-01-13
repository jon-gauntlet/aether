import { render, fireEvent, screen } from '@testing-library/react';
import { AutonomicDevelopment } from '../AutonomicDevelopment';
import { FlowState } from '../../core/types/base';
import { useAutonomic } from '../../core/autonomic/useAutonomic';

jest.mock('../../core/autonomic/useAutonomic');

describe('AutonomicDevelopment', () => {
  const mockField = {
    id: '1',
    name: 'Test Field',
    strength: 0.8,
    resonance: {
      frequency: 1.0,
      amplitude: 0.7,
      phase: 0,
      harmonics: [1.0, 2.0]
    },
    protection: {
      shields: 0.9,
      recovery: 0.8,
      resilience: 0.7,
      adaptability: 0.6
    },
    flowMetrics: {
      velocity: 0.8,
      momentum: 0.7,
      resistance: 0.2,
      conductivity: 0.9
    },
    naturalFlow: {
      direction: 1,
      intensity: 0.8,
      stability: 0.7,
      sustainability: 0.9
    }
  };

  const mockConsciousness = {
    currentState: FlowState.FLOW,
    fields: [mockField],
    flowSpace: {
      dimensions: 3,
      capacity: 100,
      utilization: 0.5,
      stability: 0.8,
      fields: [mockField],
      boundaries: []
    },
    lastTransition: Date.now(),
    stateHistory: [FlowState.FOCUS, FlowState.FLOW],
    metrics: {
      clarity: 0.8,
      depth: 0.7,
      coherence: 0.9,
      integration: 0.8,
      flexibility: 0.7
    }
  };

  beforeEach(() => {
    (useAutonomic as jest.Mock).mockReturnValue({
      isActive: true,
      currentState: FlowState.FLOW,
      activePatterns: [
        {
          pattern: { id: 'test_pattern', name: 'Test Pattern' },
          confidence: 0.8,
          matchedConditions: ['flowState', 'fieldStrength']
        }
      ],
      metrics: {
        autonomyScore: 0.8,
        patternStrength: 0.7,
        adaptability: 0.9,
        stability: 0.8
      },
      activate: jest.fn(),
      detectPatterns: jest.fn(),
      updateMetrics: jest.fn()
    });
  });

  it('should render development metrics', () => {
    render(
      <AutonomicDevelopment
        as any; // TODO: Fix type mismatchfield={mockField}
        consciousness={mockConsciousness}
      /> undefined;
    ); undefined;

    expect(screen.getByText('Autonomy Score')).toBeInTheDocument();
    expect(screen.getByText('Pattern Strength')).toBeInTheDocument();
    expect(screen.getByText('Adaptability')).toBeInTheDocument();
    expect(screen.getByText('Stability')).toBeInTheDocument();
  });

  it('should display active patterns', () => {
    render(
      <AutonomicDevelopment
        as any; // TODO: Fix type mismatchfield={mockField}
        consciousness={mockConsciousness}
      /> undefined;
    ); undefined;

    expect(screen.getByText('Test Pattern')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('should update when patterns change', () => {
    const { rerender } = render(
      <AutonomicDevelopment
        as any; // TODO: Fix type mismatchfield={mockField}
        consciousness={mockConsciousness}
      /> undefined;
    ); undefined;

    (useAutonomic as jest.Mock).mockReturnValue({
      isActive: true,
      currentState: FlowState.FLOW,
      activePatterns: [
        {
          pattern: { id: 'new_pattern', name: 'New Pattern' },
          confidence: 0.9,
          matchedConditions: ['flowState', 'resonance']
        }
      ],
      metrics: {
        autonomyScore: 0.9,
        patternStrength: 0.8,
        adaptability: 0.9,
        stability: 0.8
      },
      activate: jest.fn(),
      detectPatterns: jest.fn(),
      updateMetrics: jest.fn()
    });

    rerender(
      <AutonomicDevelopment
        as any; // TODO: Fix type mismatchfield={mockField}
        consciousness={mockConsciousness}
      /> undefined;
    ); undefined;

    expect(screen.getByText('New Pattern')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('should handle pattern activation', () => {
    const mockActivate = jest.fn();
    (useAutonomic as jest.Mock).mockReturnValue({
      isActive: false,
      currentState: FlowState.FOCUS,
      activePatterns: [],
      metrics: {
        autonomyScore: 0,
        patternStrength: 0,
        adaptability: 0.5,
        stability: 0.5
      },
      activate: mockActivate,
      detectPatterns: jest.fn(),
      updateMetrics: jest.fn()
    });

    render(
      <AutonomicDevelopment
        as any; // TODO: Fix type mismatchfield={mockField}
        consciousness={mockConsciousness}
      /> undefined;
    ); undefined;

    fireEvent.click(screen.getByText('Activate Development'));
    expect(mockActivate).toHaveBeenCalled();
  });

  it('should show development progress', () => {
    render(
      <AutonomicDevelopment
        as any; // TODO: Fix type mismatchfield={mockField}
        consciousness={mockConsciousness}
      /> undefined;
    ); undefined;

    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars).toHaveLength(4); // Autonomy, Pattern, Adaptability, Stability
    expect(progressBars[0]).toHaveAttribute('aria-valuenow', '80');
  });

  it('should handle pattern detection', () => {
    const mockDetectPatterns = jest.fn();
    (useAutonomic as jest.Mock).mockReturnValue({
      isActive: true,
      currentState: FlowState.FLOW,
      activePatterns: [],
      metrics: {
        autonomyScore: 0.8,
        patternStrength: 0.7,
        adaptability: 0.9,
        stability: 0.8
      },
      activate: jest.fn(),
      detectPatterns: mockDetectPatterns,
      updateMetrics: jest.fn()
    });

    render(
      <AutonomicDevelopment
        as any; // TODO: Fix type mismatchfield={mockField}
        consciousness={mockConsciousness}
      /> undefined;
    ); undefined;

    fireEvent.click(screen.getByText('Detect Patterns'));
    expect(mockDetectPatterns).toHaveBeenCalled();
  });
});