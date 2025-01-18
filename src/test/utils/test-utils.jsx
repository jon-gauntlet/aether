import React from 'react'
import PropTypes from 'prop-types'
import { render } from '@testing-library/react'
import { vi } from 'vitest'
import { ChakraProvider, extendTheme, useColorMode, useTheme } from '@chakra-ui/react'

// Create a test theme with required configuration
const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  colors: {
    primary: '#3182ce',
    secondary: '#718096',
    success: '#48bb78',
    error: '#e53e3e',
    warning: '#ecc94b',
  },
  fonts: {
    body: 'system-ui, sans-serif',
    heading: 'system-ui, sans-serif',
  },
  space: {
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
  },
  borderRadius: {
    sm: '0.125rem',
    md: '0.25rem',
    lg: '0.5rem',
  },
  transitions: {
    normal: '0.2s ease',
  },
});

// Mock contexts
const MessageContext = React.createContext({})
const AuthContext = React.createContext({})
const FlowContext = React.createContext({})
const EnergyContext = React.createContext({})

// Mock Chakra hooks
export const useColorModeValue = (lightValue, darkValue) => {
  const { colorMode } = useColorMode()
  return colorMode === 'light' ? lightValue : darkValue
}

// Mock components
const MockButton = ({ children, ...props }) => <button {...props}>{children}</button>
const MockBox = ({ children, ...props }) => <div {...props}>{children}</div>

// Wrapper component
export const TestWrapper = ({ children }) => {
  return (
    <ChakraProvider theme={theme}>
      <AuthContext.Provider value={{ user: null, loading: false }}>
        <MessageContext.Provider value={{ messages: [], loading: false }}>
          <FlowContext.Provider value={{ flowState: 'default', setFlowState: () => {} }}>
            <EnergyContext.Provider value={{ energy: 100, setEnergy: () => {} }}>
              {children}
            </EnergyContext.Provider>
          </FlowContext.Provider>
        </MessageContext.Provider>
      </AuthContext.Provider>
    </ChakraProvider>
  )
}

// Custom render method
const customRender = (ui, options = {}) => {
  return render(ui, { wrapper: TestWrapper, ...options })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
export { MessageContext, AuthContext, FlowContext, EnergyContext }

export const verifyShape = (obj, shape) => {
  Object.entries(shape).forEach(([key, type]) => {
    expect(obj).toHaveProperty(key)
    expect(typeof obj[key]).toBe(type)
  })
}

export const validateFlowMetrics = (metrics) => {
  expect(metrics).toHaveProperty('focusScore')
  expect(metrics).toHaveProperty('duration')
  expect(metrics).toHaveProperty('interruptions')
  expect(typeof metrics.focusScore).toBe('number')
  expect(typeof metrics.duration).toBe('number')
  expect(typeof metrics.interruptions).toBe('number')
} 