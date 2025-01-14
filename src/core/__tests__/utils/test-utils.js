import { expect, vi } from 'vitest'
import { FlowState } from '../../types/primitives/base'

/**
 * Test utility functions that support quality-first development
 * by making tests more readable and maintainable.
 */

const DEFAULT_FLOW_METRICS = {
  focus: 0.8,
  momentum: 0.7,
  quality: 0.9,
  duration: 0
}

const DEFAULT_PROTECTION_METRICS = {
  stability: 0.9,
  resilience: 0.85,
  integrity: 0.9,
  immunity: 0.85
}

/**
 * Create a mock flow state for testing
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Mock flow state
 */
export const createMockFlowState = (overrides = {}) => ({
  active: false,
  type: 'natural',
  intensity: 0.5,
  duration: 0,
  metrics: DEFAULT_FLOW_METRICS,
  lastTransition: Date.now(),
  protected: false,
  quality: 0.8,
  transitionCount: 0,
  recoveryCount: 0,
  ...overrides
})

/**
 * Create a mock protection state for testing
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Mock protection state
 */
export const createMockProtectionState = (overrides = {}) => ({
  active: true,
  metrics: DEFAULT_PROTECTION_METRICS,
  lastCheck: Date.now(),
  violations: 0,
  flowShieldActive: false,
  ...overrides
})

/**
 * Async utility to simulate time passage in tests
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Test helper to verify object shape matches expected type
 * @param {Object} obj - Object to test
 * @param {Object} shape - Expected shape with type names
 */
export const verifyShape = (obj, shape) => {
  Object.entries(shape).forEach(([key, type]) => {
    expect(typeof obj[key]).toBe(type)
  })
}

/**
 * Wrap test function with flow protection
 * @param {Function} testFn - Test function to wrap
 * @returns {Function} Protected test function
 */
export const withFlowProtection = (testFn) => async () => {
  const startTime = Date.now()
  try {
    await testFn()
  } finally {
    const duration = Date.now() - startTime
    if (duration > 1000) {
      console.warn(`Test took ${duration}ms - consider optimizing`)
    }
  }
}

/**
 * Validate flow metrics
 * @param {Object} metrics - Flow metrics to validate
 */
export const validateFlowMetrics = (metrics) => {
  expect(metrics).toBeDefined()
  expect(typeof metrics.focus).toBe('number')
  expect(typeof metrics.momentum).toBe('number')
  expect(typeof metrics.quality).toBe('number')
  expect(metrics.focus).toBeGreaterThanOrEqual(0)
  expect(metrics.focus).toBeLessThanOrEqual(1)
  expect(metrics.momentum).toBeGreaterThanOrEqual(0)
  expect(metrics.momentum).toBeLessThanOrEqual(1)
  expect(metrics.quality).toBeGreaterThanOrEqual(0)
  expect(metrics.quality).toBeLessThanOrEqual(1)
}

/**
 * Validate protection metrics
 * @param {Object} metrics - Protection metrics to validate
 */
export const validateProtectionMetrics = (metrics) => {
  expect(metrics).toBeDefined()
  expect(typeof metrics.stability).toBe('number')
  expect(typeof metrics.resilience).toBe('number')
  expect(typeof metrics.integrity).toBe('number')
  expect(typeof metrics.immunity).toBe('number')
  expect(metrics.stability).toBeGreaterThanOrEqual(0)
  expect(metrics.stability).toBeLessThanOrEqual(1)
}

/**
 * Verify flow transition
 * @param {Object} before - State before transition
 * @param {Object} after - State after transition
 * @param {Object} expectedChanges - Expected changes
 */
export const verifyFlowTransition = (before, after, expectedChanges) => {
  Object.entries(expectedChanges).forEach(([key, value]) => {
    expect(after[key]).toEqual(value)
  })
  expect(after.lastTransition).toBeGreaterThan(before.lastTransition)
}

/**
 * Validate system health
 * @param {Object} systemState - System state to validate
 */
export const validateSystemHealth = (systemState) => {
  expect(systemState).toBeDefined()
  expect(typeof systemState.health).toBe('number')
  expect(systemState.health).toBeGreaterThanOrEqual(0)
  expect(systemState.health).toBeLessThanOrEqual(1)
} 