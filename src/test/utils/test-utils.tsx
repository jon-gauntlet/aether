import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { AuthProvider } from '@/core/auth/AuthProvider';
import { Theme } from '@/styles/theme';

const defaultTheme: Theme = {
  colors: {
    primary: '#007AFF',
    onPrimary: '#FFFFFF',
    secondary: '#5856D6',
    onSecondary: '#FFFFFF',
    background: '#F2F2F7',
    surface: '#FFFFFF',
    text: '#000000'
  },
  space: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem'
  },
  fonts: {
    body: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem'
  },
  shadows: {
    sm: '0 1px 3px rgba(0,0,0,0.12)',
    md: '0 4px 6px rgba(0,0,0,0.12)',
    lg: '0 10px 15px rgba(0,0,0,0.12)'
  },
  transitions: {
    default: 'all 0.2s ease-in-out'
  },
  zIndices: {
    modal: 1000,
    overlay: 900,
    dropdown: 800,
    header: 700
  }
};

const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider theme={defaultTheme}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
};

const customRender = (ui: React.ReactElement, options = {}) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render }; 