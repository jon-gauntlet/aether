import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/hooks/useTheme';

vi.mock('@/hooks/useTheme', () => ({
  useTheme: vi.fn()
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders toggle button with current theme', () => {
    useTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: vi.fn()
    });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');

    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Toggle dark mode');
  });

  it('toggles theme when clicked', () => {
    const toggleTheme = vi.fn();
    useTheme.mockReturnValue({
      theme: 'light',
      toggleTheme
    });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');

    fireEvent.click(button);
    expect(toggleTheme).toHaveBeenCalled();
  });

  it('shows correct icon for light theme', () => {
    useTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: vi.fn()
    });

    render(<ThemeToggle />);
    expect(screen.getByLabelText('Toggle dark mode')).toBeInTheDocument();
  });

  it('shows correct icon for dark theme', () => {
    useTheme.mockReturnValue({
      theme: 'dark',
      toggleTheme: vi.fn()
    });

    render(<ThemeToggle />);
    expect(screen.getByLabelText('Toggle light mode')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    useTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: vi.fn()
    });

    render(<ThemeToggle className="custom-class" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('handles keyboard interaction', () => {
    const toggleTheme = vi.fn();
    useTheme.mockReturnValue({
      theme: 'light',
      toggleTheme
    });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');

    fireEvent.keyDown(button, { key: 'Enter' });
    expect(toggleTheme).toHaveBeenCalled();

    toggleTheme.mockClear();

    fireEvent.keyDown(button, { key: ' ' });
    expect(toggleTheme).toHaveBeenCalled();
  });
}); 