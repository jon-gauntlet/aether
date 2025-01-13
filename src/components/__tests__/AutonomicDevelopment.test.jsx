import { render, fireEvent, screen } from '@testing-library/react';
import { AutonomicDevelopment } from '../AutonomicDevelopment';
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
    currentState: 'FLOW',
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
    metrics: {
      focus: 0.8,
      clarity: 0.7,
      presence: 0.9
    }
  };

  const mockFlowStates = [
    {
      metrics: {
        velocity: 0.8,
        momentum: 0.7,
        resistance: 0.2,
        conductivity: 0.9
      }
    }
  ];

  beforeEach(() => {
    useAutonomic.mockReturnValue({
      consciousness: mockConsciousness,
      flowStates: mockFlowStates
    });
  });

  it('renders without crashing', () => {
    render(<AutonomicDevelopment flowStates={mockFlowStates} isActive={true} />);
    expect(screen.getByText('Autonomic Development')).toBeInTheDocument();
  });

  it('displays correct metrics', () => {
    render(<AutonomicDevelopment flowStates={mockFlowStates} isActive={true} />);
    expect(screen.getByText(/Velocity:/)).toBeInTheDocument();
    expect(screen.getByText(/Momentum:/)).toBeInTheDocument();
    expect(screen.getByText(/Resistance:/)).toBeInTheDocument();
    expect(screen.getByText(/Conductivity:/)).toBeInTheDocument();
  });
}); 