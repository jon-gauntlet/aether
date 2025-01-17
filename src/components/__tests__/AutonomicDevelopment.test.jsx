import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider } from 'styled-components';
import AutonomicDevelopment from '../AutonomicDevelopment';

const theme = {
  colors: {
    primary: '#6366F1',
    secondary: '#8B5CF6',
    surface: '#1F2937',
    background: '#111827',
    text: '#F9FAFB',
    textAlt: '#9CA3AF'
  },
  space: {
    md: '1rem',
    lg: '1.5rem'
  },
  borderRadius: {
    medium: '0.5rem',
    large: '1rem'
  },
  transitions: {
    normal: '0.2s'
  },
  fontSizes: {
    lg: '1.125rem',
    xl: '1.25rem'
  }
};

describe('AutonomicDevelopment', () => {
  const mockFlowStates = [
    { metrics: { velocity: 0.5, momentum: 0.6, resistance: 0.3, conductivity: 0.7 } },
    { metrics: { velocity: 0.7, momentum: 0.8, resistance: 0.2, conductivity: 0.9 } },
    { metrics: { velocity: 0.6, momentum: 0.7, resistance: 0.4, conductivity: 0.8 } }
  ];

  beforeEach(() => {
    // Mock canvas context
    const mockCtx = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fillRect: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      clearRect: vi.fn()
    };

    // Mock canvas element
    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx);
  });

  const renderWithTheme = (ui) => {
    return render(
      <ThemeProvider theme={theme}>
        {ui}
      </ThemeProvider>
    );
  };

  it('renders metrics grid with correct values', () => {
    renderWithTheme(<AutonomicDevelopment flowStates={mockFlowStates} isActive={true} />);
    
    expect(screen.getByText(/Velocity:/)).toBeInTheDocument();
    expect(screen.getByText(/Momentum:/)).toBeInTheDocument();
    expect(screen.getByText(/Resistance:/)).toBeInTheDocument();
    expect(screen.getByText(/Conductivity:/)).toBeInTheDocument();
    
    expect(screen.getByText(/60%/)).toBeInTheDocument(); // Average velocity
    expect(screen.getByText(/70%/)).toBeInTheDocument(); // Average momentum
    expect(screen.getByText(/30%/)).toBeInTheDocument(); // Average resistance
    expect(screen.getByText(/80%/)).toBeInTheDocument(); // Average conductivity
  });

  it('displays active status when isActive is true', () => {
    renderWithTheme(<AutonomicDevelopment flowStates={mockFlowStates} isActive={true} />);
    expect(screen.getByText(/Active Flow States: 3/)).toBeInTheDocument();
  });

  it('displays inactive status when isActive is false', () => {
    renderWithTheme(<AutonomicDevelopment flowStates={mockFlowStates} isActive={false} />);
    expect(screen.getByText(/Active Flow States: 3/)).toBeInTheDocument();
  });

  it('initializes canvas with correct dimensions', () => {
    const { container } = renderWithTheme(<AutonomicDevelopment flowStates={mockFlowStates} isActive={true} />);
    const canvas = container.querySelector('canvas');
    
    expect(canvas).toBeInTheDocument();
    expect(canvas.getAttribute('width')).toBe('800');
    expect(canvas.getAttribute('height')).toBe('200');
  });
}); 