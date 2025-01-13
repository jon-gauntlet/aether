import 'styled-components';

export interface Theme {
  colors: {
    background: string;
    text: string;
    primary: string;
    secondary: string;
    surface: string;
    onPrimary: string;
  };
  space: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
  };
  fonts: {
    body: string;
    heading: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  shadows: {
    sm: string;
    md: string;
  };
  transitions: {
    default: string;
  };
  zIndices: {
    modal: number;
    overlay: number;
    dropdown: number;
  };
}

export type DefaultTheme = Theme;

// Theme utilities
export const getSpace = (key: keyof Theme['space']) => (theme: Theme) => theme.space[key];
export const getBorderRadius = (key: keyof Theme['borderRadius']) => (theme: Theme) => theme.borderRadius[key];
export const getColors = (key: keyof Theme['colors']) => (theme: Theme) => theme.colors[key]; 