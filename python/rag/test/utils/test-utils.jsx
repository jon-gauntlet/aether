import React from 'react'
import PropTypes from 'prop-types'
import { render } from '@testing-library/react'
import { vi } from 'vitest'
import { AuthProvider } from '../../contexts/AuthContext'
import { MessageProvider } from '../../contexts/MessageContext'
import { FlowProvider } from '../../contexts/FlowContext'
import { EnergyProvider } from '../../contexts/EnergyContext'
import { ProtectionProvider } from '../../contexts/ProtectionContext'

const mockAuthValue = {
  user: null,
  loading: false,
  error: null,
  login: vi.fn(),
  logout: vi.fn(),
  signup: vi.fn(),
}

const mockMessageValue = {
  messages: [],
  sendMessage: vi.fn(),
  deleteMessage: vi.fn(),
  updateMessage: vi.fn(),
}

const mockFlowValue = {
  isInFlow: false,
  flowMetrics: {},
  startFlow: vi.fn(),
  endFlow: vi.fn(),
}

const mockEnergyValue = {
  energyLevel: 100,
  updateEnergy: vi.fn(),
}

const mockProtectionValue = {
  isProtected: true,
  boundaries: {},
  updateBoundaries: vi.fn(),
}

const AllProviders = ({ children, customProviders = {} }) => {
  const {
    auth = mockAuthValue,
    message = mockMessageValue,
    flow = mockFlowValue,
    energy = mockEnergyValue,
    protection = mockProtectionValue,
  } = customProviders

  return (
    <AuthProvider value={auth}>
      <MessageProvider value={message}>
        <FlowProvider value={flow}>
          <EnergyProvider value={energy}>
            <ProtectionProvider value={protection}>
              {children}
            </ProtectionProvider>
          </EnergyProvider>
        </FlowProvider>
      </MessageProvider>
    </AuthProvider>
  )
}

AllProviders.propTypes = {
  children: PropTypes.node.isRequired,
  customProviders: PropTypes.shape({
    auth: PropTypes.object,
    message: PropTypes.object,
    flow: PropTypes.object,
    energy: PropTypes.object,
    protection: PropTypes.object,
  }),
}

const customRender = (ui, options = {}) => {
  const { customProviders, ...renderOptions } = options
  return render(ui, {
    wrapper: (props) => <AllProviders {...props} customProviders={customProviders} />,
    ...renderOptions,
  })
}

export * from '@testing-library/react'
export { customRender as render }

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