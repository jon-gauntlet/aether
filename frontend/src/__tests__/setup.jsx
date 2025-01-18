import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { vi } from 'vitest';

// Shared Chakra UI mocks
vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    __esModule: true,
    ...actual,
    Box: ({ children, ...props }) => <div {...props}>{children}</div>,
    VStack: ({ children, ...props }) => <div {...props}>{children}</div>,
    Text: ({ children, ...props }) => <span {...props}>{children}</span>,
    Input: ({ ...props }) => <input {...props} />,
    Button: ({ children, onClick, ...props }) => <button onClick={onClick} {...props}>{children}</button>,
    IconButton: ({ children, ...props }) => <button {...props}>{children}</button>,
    Skeleton: ({ ...props }) => <div data-testid="skeleton" {...props} />,
    Fade: ({ children, ...props }) => <div {...props}>{children}</div>,
    useColorMode: () => ({
      colorMode: 'light',
      toggleColorMode: vi.fn(),
    }),
  };
});

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {},
    },
  });
}

export function TestWrapper({ children }) {
  const testQueryClient = createTestQueryClient();

  return (
    <ChakraProvider>
      <QueryClientProvider client={testQueryClient}>
        <MemoryRouter>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    </ChakraProvider>
  );
} 