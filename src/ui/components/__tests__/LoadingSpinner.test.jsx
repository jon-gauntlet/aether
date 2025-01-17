import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
    expect(spinner).toHaveClass('text-blue-500'); // default color
  });

  it('applies different sizes', () => {
    const sizes = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8',
      xl: 'w-12 h-12'
    };

    Object.entries(sizes).forEach(([size, expectedClass]) => {
      const { rerender } = render(<LoadingSpinner size={size} />);
      expect(screen.getByRole('status')).toHaveClass(expectedClass);
      rerender(<></>);
    });
  });

  it('applies different colors', () => {
    const colors = {
      blue: 'text-blue-500',
      green: 'text-green-500',
      red: 'text-red-500',
      yellow: 'text-yellow-500',
      gray: 'text-gray-500'
    };

    Object.entries(colors).forEach(([color, expectedClass]) => {
      const { rerender } = render(<LoadingSpinner color={color} />);
      expect(screen.getByRole('status')).toHaveClass(expectedClass);
      rerender(<></>);
    });
  });

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    expect(screen.getByRole('status')).toHaveClass('custom-class');
  });

  it('has correct ARIA attributes', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('renders with custom label', () => {
    const label = 'Custom loading message';
    render(<LoadingSpinner label={label} />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', label);
  });

  it('renders with custom speed', () => {
    render(<LoadingSpinner speed="slow" />);
    expect(screen.getByRole('status')).toHaveClass('animate-spin-slow');

    const { rerender } = render(<LoadingSpinner speed="fast" />);
    expect(screen.getByRole('status')).toHaveClass('animate-spin-fast');
    rerender(<></>);
  });

  it('renders with track', () => {
    render(<LoadingSpinner showTrack />);
    expect(screen.getByRole('status')).toHaveClass('ring-2');
    expect(screen.getByRole('status')).toHaveClass('ring-gray-200');
  });
}); 