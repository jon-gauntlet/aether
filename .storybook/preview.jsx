import React from 'react'
import { ThemeProvider } from '../src/theme/ThemeProvider'
import { withThemeFromJSXProvider } from '@storybook/addon-themes'
import { createGlobalStyle } from 'styled-components'

const GlobalStyles = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: ${props => props.theme.typography.fonts.body};
    background: ${props => props.theme.isDark ? props.theme.colors.neutral[900] : props.theme.colors.neutral[50]};
    color: ${props => props.theme.isDark ? props.theme.colors.neutral[50] : props.theme.colors.neutral[900]};
  }
`

/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      disable: true,
      grid: {
        disable: true
      }
    },
    themes: {
      default: 'light',
      list: [
        { name: 'light', class: '', color: '#f8fafc' },
        { name: 'dark', class: 'dark', color: '#0f172a' },
      ],
    },
  },
  decorators: [
    withThemeFromJSXProvider({
      Provider: ThemeProvider,
      GlobalStyles,
    })
  ],
} 