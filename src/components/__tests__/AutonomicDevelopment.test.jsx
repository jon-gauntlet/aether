import { render, fireEvent, screen } from '@testing-library/react';
import { AutonomicDevelopment } from '../AutonomicDevelopment';
import { useAutonomic } from '../../core/autonomic/useAutonomic';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../styles/theme';

vi.mock('../../core/autonomic/useAutonomic');

// Mock canvas context
const mockContext = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
};

// Mock canvas element
HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext);

/**
 * @typedef {Object} Resonance
 * @property {number} frequency
 * @property {number} amplitude
 * @property {number} phase
 * @property {number[]} harmonics
 */

/**
 * @typedef {Object} Protection
 * @property {number} shields
 * @property {number} recovery
 * @property {number} resilience
 * @property {number} adaptability
 */

/**
 * @typedef {Object} FlowMetrics
 * @property {number} velocity
 * @property {number} momentum
 * @property {number} resistance
 * @property {number} conductivity
 */

/**
 * @typedef {Object} NaturalFlow
 * @property {number} direction
 * @property {number} intensity
 * @property {number} stability
 * @property {number} sustainability
 */

/**
 * @typedef {Object} Field
 * @property {string} id
 * @property {string} name
 * @property {number} strength
 * @property {Resonance} resonance
 * @property {Protection} protection
 * @property {FlowMetrics} flowMetrics
 * @property {NaturalFlow} naturalFlow
 */

describe('AutonomicDevelopment', () => {
  /** @type {Field} */
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

  /** @type {Object} */
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

  /** @type {Array<{metrics: FlowMetrics}>} */
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
    vi.mocked(useAutonomic).mockReturnValue({
      consciousness: mockConsciousness,
      flowStates: mockFlowStates
    });
  });

  it('renders without crashing', () => {
    render(
      <ThemeProvider theme={theme}>
        <AutonomicDevelopment flowStates={mockFlowStates} isActive={true} />
      </ThemeProvider>
    );
    expect(screen.getByText('Autonomic Development')).toBeInTheDocument();
  });

  it('displays correct metrics', () => {
    render(
      <ThemeProvider theme={theme}>
        <AutonomicDevelopment flowStates={mockFlowStates} isActive={true} />
      </ThemeProvider>
    );
    expect(screen.getByText(/Velocity:/)).toBeInTheDocument();
    expect(screen.getByText(/Momentum:/)).toBeInTheDocument();
    expect(screen.getByText(/Resistance:/)).toBeInTheDocument();
    expect(screen.getByText(/Conductivity:/)).toBeInTheDocument();
  });
}); 