import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../theme';

export function TestWrapper({ children }) {
  return (
    <ChakraProvider theme={theme}>
      {children}
    </ChakraProvider>
  );
} 