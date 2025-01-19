import React, { createContext, useContext, useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import * as tokens from './tokens'

// Create theme context
const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
  theme: {}
})

// Theme configurations
const lightTheme = {
  colors: {
    background: tokens.colors.neutral[50],
    foreground: tokens.colors.neutral[900],
    primary: tokens.colors.primary[500],
    secondary: tokens.colors.neutral[500],
    success: tokens.colors.success[500],
    warning: tokens.colors.warning[500],
    error: tokens.colors.error[500],
    muted: tokens.colors.neutral[200],
    
    // Component specific
    card: {
      background: 'white',
      border: tokens.colors.neutral[200]
    },
    input: {
      background: 'white',
      border: tokens.colors.neutral[300],
      placeholder: tokens.colors.neutral[400]
    },
    button: {
      primary: tokens.colors.primary[500],
      secondary: tokens.colors.neutral[200]
    }
  },
  ...tokens
}

const darkTheme = {
  colors: {
    background: tokens.colors.neutral[900],
    foreground: tokens.colors.neutral[50],
    primary: tokens.colors.primary[400],
    secondary: tokens.colors.neutral[400],
    success: tokens.colors.success[400],
    warning: tokens.colors.warning[400],
    error: tokens.colors.error[400],
    muted: tokens.colors.neutral[700],
    
    // Component specific
    card: {
      background: tokens.colors.neutral[800],
      border: tokens.colors.neutral[700]
    },
    input: {
      background: tokens.colors.neutral[800],
      border: tokens.colors.neutral[600],
      placeholder: tokens.colors.neutral[500]
    },
    button: {
      primary: tokens.colors.primary[400],
      secondary: tokens.colors.neutral[700]
    }
  },
  ...tokens
}

export const ThemeProvider = ({ children }) => {
  // Check system preference and localStorage
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      return savedTheme === 'dark'
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  const [isDark, setIsDark] = React.useState(getInitialTheme)

  // Toggle theme
  const toggleTheme = useCallback(() => {
    setIsDark(prev => !prev)
  }, [])

  // Update localStorage and document class when theme changes
  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      const hasStoredPreference = localStorage.getItem('theme')
      if (!hasStoredPreference) {
        setIsDark(e.matches)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Combine theme tokens with color mode
  const theme = React.useMemo(() => ({
    ...(isDark ? darkTheme : lightTheme),
    isDark
  }), [isDark])

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, theme }}>
      <StyledThemeProvider theme={theme}>
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  )
}

// Custom hook for accessing theme context
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Prop types
ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired
}

// Default props
ThemeProvider.defaultProps = {
  children: null
} 