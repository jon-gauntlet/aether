import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '../components/ThemeToggle';
import { TestWrapper } from './setup';

describe('ThemeToggle', () => {
  it('renders toggle button', () => {
    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );
    
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
  });

  it('toggles theme on click', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );
    
    const button = screen.getByRole('button', { name: /toggle theme/i });
    await user.click(button);
    
    // Check if theme class is applied to body
    expect(document.body).toHaveClass('light-theme');
    
    await user.click(button);
    expect(document.body).toHaveClass('dark-theme');
  });

  it('shows correct icon based on theme', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );
    
    const button = screen.getByRole('button', { name: /toggle theme/i });
    
    // Initial state (dark theme)
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
    
    // After toggle (light theme)
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
    
    const button = screen.getByRole('button', { name: /toggle theme/i });
    await user.click(button);
    
    // Unmount and remount
    rerender(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );
    
    // Theme should persist
    expect(document.body).toHaveClass('light-theme');
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
  });

  it('applies theme-specific styles', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );
    
    const button = screen.getByRole('button', { name: /toggle theme/i });
    
    // Dark theme
    expect(button).toHaveStyle({
      backgroundColor: 'var(--background-secondary)',
      color: 'var(--text-primary)'
    });
    
    // Light theme
    await user.click(button);
    expect(button).toHaveStyle({
      backgroundColor: 'var(--background-secondary)',
      color: 'var(--text-primary)'
    });
  });
}); 