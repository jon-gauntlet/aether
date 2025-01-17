import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import { theme } from '../theme';

export function TestWrapper({ children }) {
  return (
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </ChakraProvider>
  );
}

export function renderWithProviders(ui) {
  return render(ui, { wrapper: TestWrapper });
} 