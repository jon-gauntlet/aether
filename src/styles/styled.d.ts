import 'styled-components'

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      primary: string;
      secondary: string;
      background: string;
      surface: string;
      text: string;
      textAlt: string;
      success: string;
      warning: string;
      error: string;
    };
    fonts: {
      body: string;
      heading: string;
      mono: string;
    };
    fontSizes: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
    };
    space: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
    };
    borderRadius: {
      small: string;
      medium: string;
      large: string;
      full: string;
    };
    shadows: {
      small: string;
      medium: string;
      large: string;
    };
    transitions: {
      fast: string;
      normal: string;
      slow: string;
    };
    zIndices: {
      base: number;
      above: number;
      below: number;
      modal: number;
      overlay: number;
      tooltip: number;
    };
  }
} 