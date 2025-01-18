import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '../test/utils';
import { ThemeToggle } from '../components/ThemeToggle';
import { useColorMode } from '@chakra-ui/react';

// Mock Chakra icons
vi.mock('@chakra-ui/icons', () => ({
  SunIcon: () => <span data-testid="sun-icon">☀️</span>,
  MoonIcon: () => <span data-testid="moon-icon">🌙</span>,
}));

describe('ThemeToggle', () => {
  const mockToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useColorMode.mockReturnValue({
      colorMode: 'light',
      toggleColorMode: mockToggle,
    });
  });

  it('renders toggle button', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('toggles theme on click', () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockToggle).toHaveBeenCalled();
  });

  it('shows correct icon based on theme', () => {
    useColorMode.mockReturnValue({
      colorMode: 'dark',
      toggleColorMode: mockToggle,
    });
    render(<ThemeToggle />);
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();

    useColorMode.mockReturnValue({
      colorMode: 'light',
      toggleColorMode: mockToggle,
    });
    render(<ThemeToggle />);
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
  });

  it('applies theme-specific styles', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
  });
}); 