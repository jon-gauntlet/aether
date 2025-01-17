import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { vi } from 'vitest';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
      staleTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
});

export const TestWrapper = ({ children }) => {
  const testQueryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={testQueryClient}>
      <ChakraProvider>
        <ColorModeScript initialColorMode="light" />
        {children}
      </ChakraProvider>
    </QueryClientProvider>
  );
}; 