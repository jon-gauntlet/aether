import React from 'react';
import { render as rtlRender, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { vi } from 'vitest';

// Mock Chakra UI components
vi.mock('@chakra-ui/react', () => ({
  ChakraProvider: ({ children }) => <>{children}</>,
  useColorMode: vi.fn(() => ({
    colorMode: 'light',
    toggleColorMode: vi.fn(),
  })),
  Box: ({ children, ...props }) => <div data-testid="chakra-box" {...props}>{children}</div>,
  Text: ({ children, ...props }) => <p data-testid="chakra-text" {...props}>{children}</p>,
  Flex: ({ children, ...props }) => <div data-testid="chakra-flex" {...props}>{children}</div>,
  IconButton: ({ children, icon, ...props }) => (
    <button data-testid="chakra-icon-button" {...props}>
      {icon}
      {children}
    </button>
  ),
  Button: ({ children, ...props }) => (
    <button data-testid="chakra-button" {...props}>{children}</button>
  ),
  Input: ({ ...props }) => <input data-testid="chakra-input" {...props} />,
  FormLabel: ({ children, ...props }) => (
    <label data-testid="chakra-form-label" {...props}>{children}</label>
  ),
  FormControl: ({ children, ...props }) => (
    <div data-testid="chakra-form-control" {...props}>{children}</div>
  ),
  Skeleton: ({ children, ...props }) => (
    <div data-testid="chakra-skeleton" {...props}>{children}</div>
  ),
  HStack: ({ children, ...props }) => (
    <div data-testid="chakra-hstack" {...props}>{children}</div>
  ),
  Textarea: ({ ...props }) => (
    <textarea data-testid="chakra-textarea" {...props} />
  ),
}));

// Mock icons
vi.mock('@chakra-ui/icons', () => ({
  ChatIcon: () => <span data-testid="chat-icon">Chat</span>,
  SunIcon: () => <span data-testid="sun-icon">Sun</span>,
  MoonIcon: () => <span data-testid="moon-icon">Moon</span>,
}));

// Mock providers
vi.mock('../../contexts/ReactionProvider', () => ({
  ReactionProvider: ({ children }) => <>{children}</>,
  useReactions: () => ({
    reactions: [],
    addReaction: vi.fn(),
    removeReaction: vi.fn(),
  }),
}));

vi.mock('../../contexts/SpaceProvider', () => ({
  SpaceProvider: ({ children }) => <>{children}</>,
  useSpaces: () => ({
    currentSpace: { id: 'test-space', name: 'Test Space' },
    spaces: [],
  }),
}));

// Test wrapper component
function TestWrapper({ children }) {
  return (
    <ChakraProvider>
      {children}
    </ChakraProvider>
  );
}

// Custom render function
function renderWithProviders(ui, options = {}) {
  return rtlRender(ui, {
    wrapper: TestWrapper,
    ...options,
  });
}

// Re-export everything
export * from '@testing-library/react';
export { renderWithProviders as render }; 