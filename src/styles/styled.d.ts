import 'styled-components'

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      background: string
      backgroundAlt: string
      surface: string
      primary: string
      secondary: string
      text: string
      textAlt: string
      textLight: string
      accent: string
      error: string
      onError: string
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
    spacing: {
      small: string
      medium: string
      large: string
    }
    borderRadius: {
      small: string
      medium: string
      large: string
    }
  }
} 