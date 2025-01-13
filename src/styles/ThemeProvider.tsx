import React from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { theme, Theme } from './theme';

interface ThemeProviderProps {
  children: React.ReactNode;
  customTheme?: Partial<Theme>;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children,
  customTheme
}) => {
  // Natural theme merging
  const mergedTheme = customTheme ? {
    ...theme,
    ...customTheme,
    space: { ...theme.space, ...customTheme.space },
    borderRadius: { ...theme.borderRadius, ...customTheme.borderRadius },
    colors: { ...theme.colors, ...customTheme.colors }
  } : theme;

  return (
    <StyledThemeProvider theme={mergedTheme}>
      {children}
    </StyledThemeProvider>
  );
};

export type {  };
export {  }; 