import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '../components/ThemeToggle';
import { TestWrapper } from './setup';

// Mock icons
vi.mock('@chakra-ui/icons', () => ({
  SunIcon: () => <span data-testid="sun-icon">☀️</span>,
  MoonIcon: () => <span data-testid="moon-icon">🌙</span>,
}));

describe('ThemeToggle', () => {
  it('renders toggle button', () => {
    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );
    
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('toggles theme on click', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );
    
    const button = screen.getByTestId('theme-toggle');
    
    // Initial state (light theme)
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
    
    // Click to toggle to dark theme
    await user.click(button);
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
  });

  it('shows correct icon based on theme', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );
    
    const button = screen.getByTestId('theme-toggle');
    
    // Initial state (light theme)
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
    
    // After toggle (dark theme)
    await user.click(button);
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
  });

  it('persists theme preference', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );
    
    const button = screen.getByTestId('theme-toggle');
    await user.click(button);
    
    // Unmount and remount
    rerender(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );
    
    // Theme should persist
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
  });

  it('applies theme-specific styles', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );
    
    const button = screen.getByTestId('theme-toggle');
    
    // Initial theme (light)
    expect(button).toHaveAttribute('data-theme', 'light');
    
    // Toggle to dark theme
    await user.click(button);
    expect(button).toHaveAttribute('data-theme', 'dark');
  });
}); 