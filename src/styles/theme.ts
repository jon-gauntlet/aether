import { DefaultTheme } from 'styled-components'

const theme: DefaultTheme = {
  colors: {
    background: '#000000',
    backgroundAlt: '#111111',
    surface: '#222222',
    primary: '#6200ee',
    secondary: '#03dac6',
    text: '#ffffff',
    textAlt: '#cccccc',
    textLight: '#999999',
    accent: '#bb86fc',
    error: '#cf6679',
    onError: '#000000',
    success: '#00c853',
    warning: '#ffd600'
  },
  shadows: {
    small: '0 2px 4px rgba(0,0,0,0.1)',
    medium: '0 4px 8px rgba(0,0,0,0.2)',
    large: '0 8px 16px rgba(0,0,0,0.3)'
  },
  transitions: {
    fast: '0.1s ease',
    normal: '0.2s ease',
    slow: '0.3s ease'
  },
  spacing: {
    small: '0.5rem',
    medium: '1rem',
    large: '2rem'
  },
  borderRadius: {
    small: '0.25rem',
    medium: '0.5rem',
    large: '1rem'
  }
}

export { theme } 