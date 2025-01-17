import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useColorMode } from '@chakra-ui/react';
import { ThemeToggle } from '../components/ThemeToggle';
import { TestWrapper } from './setup';

// Mock useColorMode hook
vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useColorMode: vi.fn()
  };
});

describe('ThemeToggle', () => {
  const mockToggleColorMode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useColorMode.mockReturnValue({
      colorMode: 'light',
      toggleColorMode: mockToggleColorMode
    });
  });

  it('renders toggle button', () => {
    render(<ThemeToggle />, { wrapper: TestWrapper });
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('toggles theme on click', () => {
    render(<ThemeToggle />, { wrapper: TestWrapper });
    fireEvent.click(screen.getByRole('button'));
    expect(mockToggleColorMode).toHaveBeenCalled();
  });

  it('shows correct icon based on theme', () => {
    useColorMode.mockReturnValueOnce({
      colorMode: 'dark',
      toggleColorMode: mockToggleColorMode
    });

    const { rerender } = render(<ThemeToggle />, { wrapper: TestWrapper });
    expect(screen.getByLabelText(/switch to light mode/i)).toBeInTheDocument();

    useColorMode.mockReturnValueOnce({
      colorMode: 'light',
      toggleColorMode: mockToggleColorMode
    });

    rerender(<ThemeToggle />);
    expect(screen.getByLabelText(/switch to dark mode/i)).toBeInTheDocument();
  });

  it('persists theme preference', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    render(<ThemeToggle />, { wrapper: TestWrapper });
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(setItemSpy).toHaveBeenCalledWith('chakra-ui-color-mode', 'dark');
    setItemSpy.mockRestore();
  });

  it('applies theme-specific styles', () => {
    useColorMode.mockReturnValue({
      colorMode: 'dark',
      toggleColorMode: mockToggleColorMode
    });

    render(<ThemeToggle />, { wrapper: TestWrapper });
    const button = screen.getByRole('button');
    
    expect(button).toHaveStyle({
      backgroundColor: 'var(--chakra-colors-gray-700)'
    });
  });
}); 