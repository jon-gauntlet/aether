import { DefaultTheme } from 'styled-components'

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      background: string
      surface: string
      primary: string
      secondary: string
      text: string
      textLight: string
      accent: string
      error: string
      success: string
      warning: string
    }
    shadows: {
      small: string
      medium: string
      large: string
    }
    transitions: {
      fast: string
      normal: string
      slow: string
    }
    breakpoints: {
      mobile: string
      tablet: string
      desktop: string
      wide: string
    }
  }
}

export const theme: DefaultTheme = {
  colors: {
    background: '#f8f9fa',
    surface: '#ffffff',
    primary: '#4a90e2',
    secondary: '#50e3c2',
    text: '#2c3e50',
    textLight: '#7f8c8d',
    accent: '#8e44ad',
    error: '#e74c3c',
    success: '#2ecc71',
    warning: '#f1c40f',
  },
  shadows: {
    small: '0 2px 4px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
    large: '0 8px 16px rgba(0, 0, 0, 0.1)',
  },
  transitions: {
    fast: '0.2s ease',
    normal: '0.3s ease',
    slow: '0.5s ease',
  },
  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1440px',
  },
} 