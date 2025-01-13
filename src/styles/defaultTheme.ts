import { Theme } from './theme';

export const defaultTheme: Theme = {
  colors: {
    background: '#ffffff',
    text: '#1a1a1a',
    primary: '#2563eb',
    secondary: '#64748b',
    surface: '#f8fafc',
    onPrimary: '#ffffff',
  },
  space: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
  },
  fonts: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.05)',
  },
  transitions: {
    default: 'all 0.2s ease-in-out',
  },
  zIndices: {
    modal: 1000,
    overlay: 900,
    dropdown: 800,
  },
}; 