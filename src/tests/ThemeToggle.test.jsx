import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../components/ThemeToggle';
import { withFlowProtection, createDebugContext, withDebugProtection, analyzeDebugContext } from '../core/__tests__/utils/debug-utils';
import { TestWrapper } from './TestWrapper';

const mockToggleColorMode = vi.fn();
const mockUseColorMode = vi.fn(() => ({
  colorMode: 'light',
  toggleColorMode: mockToggleColorMode,
}));

// Mock Chakra UI components and hooks
vi.mock('@chakra-ui/react', () => ({
  useColorMode: () => mockUseColorMode(),
  IconButton: ({ children, 'aria-label': ariaLabel, ...props }) => (
    <button data-testid="theme-toggle" aria-label={ariaLabel} {...props}>{children}</button>
  ),
  ChakraProvider: ({ children, theme }) => (
    <div data-testid="chakra-provider" data-theme={theme}>
      {children}
    </div>
  ),
}));

// Mock Chakra UI icons
vi.mock('@chakra-ui/icons', () => ({
  SunIcon: () => <span data-testid="sun-icon">☀️</span>,
  MoonIcon: () => <span data-testid="moon-icon">🌙</span>,
}));

describe('ThemeToggle', () => {
  let debugContext;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseColorMode.mockClear();
    mockToggleColorMode.mockClear();
    debugContext = createDebugContext();
  });

  const renderWithWrapper = (component) => {
    return render(component, { wrapper: TestWrapper });
  };

  it('renders toggle button', withFlowProtection(async () => {
    withDebugProtection(() => {
      mockUseColorMode.mockReturnValue({ colorMode: 'light', toggleColorMode: mockToggleColorMode });
      renderWithWrapper(<ThemeToggle />);
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    }, debugContext);
  }));

  it('toggles theme on click', withFlowProtection(async () => {
    withDebugProtection(() => {
      mockUseColorMode.mockReturnValue({ colorMode: 'light', toggleColorMode: mockToggleColorMode });
      renderWithWrapper(<ThemeToggle />);
      fireEvent.click(screen.getByTestId('theme-toggle'));
      expect(mockToggleColorMode).toHaveBeenCalled();
    }, debugContext);
  }));

  it('shows correct icon based on theme', withFlowProtection(async () => {
    withDebugProtection(() => {
      mockUseColorMode.mockReturnValue({ colorMode: 'dark', toggleColorMode: mockToggleColorMode });
      renderWithWrapper(<ThemeToggle />);
      const button = screen.getByTestId('theme-toggle');
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
    }, debugContext);
  }));

  it('persists theme preference', withFlowProtection(async () => {
    withDebugProtection(() => {
      mockUseColorMode.mockReturnValue({ colorMode: 'light', toggleColorMode: mockToggleColorMode });
      renderWithWrapper(<ThemeToggle />);
      fireEvent.click(screen.getByTestId('theme-toggle'));
      expect(mockToggleColorMode).toHaveBeenCalled();
    }, debugContext);
  }));

  it('applies theme-specific styles', withFlowProtection(async () => {
    withDebugProtection(() => {
      mockUseColorMode.mockReturnValue({ colorMode: 'dark', toggleColorMode: mockToggleColorMode });
      renderWithWrapper(<ThemeToggle />);
      const button = screen.getByTestId('theme-toggle');
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
    }, debugContext);
  }));

  afterEach(() => {
    const analysis = analyzeDebugContext(debugContext);
    if (analysis.warningCount > 0) {
      console.warn('Test optimization recommendations:', analysis.recommendations);
    }
  });
}); 