import { FlowState, FlowStateType, FlowIntensity } from '../../types/flow/types';
import { FlowMetrics, DEFAULT_FLOW_METRICS } from '../../types/flow/metrics';
import { ProtectionState, ProtectionMetrics } from '../../types/protection/protection';

/**
 * Test utility functions that support quality-first development
 * by making tests more readable and maintainable.
 */

const DEFAULT_PROTECTION_METRICS: ProtectionMetrics = {
  stability: 0.9,
  resilience: 0.85,
  integrity: 0.9,
  immunity: 0.85
};

export const createMockFlowState = (overrides?: Partial<FlowState>): FlowState => ({
  active: false,
  type: FlowStateType.FOCUS,
  intensity: 'medium' as FlowIntensity,
  duration: 0,
  metrics: DEFAULT_FLOW_METRICS,
  lastTransition: Date.now(),
  protected: false,
  quality: 0.8,
  ...overrides
});

export const createMockProtectionState = (overrides?: Partial<ProtectionState>): ProtectionState => ({
  active: true,
  metrics: DEFAULT_PROTECTION_METRICS,
  lastCheck: Date.now(),
  violations: 0,
  flowShieldActive: false,
  ...overrides
});

/**
 * Async utility to simulate time passage in tests
 * @param ms Milliseconds to wait
 */
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Test helper to verify object shape matches expected type
 * @param obj Object to test
 * @param shape Expected shape with type names
 */
export const verifyShape = (obj: any, shape: Record<string, string>) => {
  Object.entries(shape).forEach(([key, type]) => {
    expect(typeof obj[key]).toBe(type.toLowerCase());
  });
};

/**
 * Creates a test wrapper that ensures tests run within flow protection
 */
export const withFlowProtection = (testFn: () => Promise<void>) => async () => {
  const originalConsoleError = console.error;
  console.error = jest.fn();

  try {
    await testFn();
  } finally {
    console.error = originalConsoleError;
  }
};

/**
 * Validates flow metrics are within healthy ranges
 */
export const validateFlowMetrics = (metrics: FlowMetrics) => {
  expect(metrics.velocity).toBeGreaterThanOrEqual(0);
  expect(metrics.velocity).toBeLessThanOrEqual(1);
  expect(metrics.momentum).toBeGreaterThanOrEqual(0);
  expect(metrics.momentum).toBeLessThanOrEqual(1);
  expect(metrics.resistance).toBeGreaterThanOrEqual(0);
  expect(metrics.resistance).toBeLessThanOrEqual(1);
  expect(metrics.conductivity).toBeGreaterThanOrEqual(0);
  expect(metrics.conductivity).toBeLessThanOrEqual(1);
  expect(metrics.focus).toBeGreaterThanOrEqual(0);
  expect(metrics.focus).toBeLessThanOrEqual(1);
  expect(metrics.energy).toBeGreaterThanOrEqual(0);
  expect(metrics.energy).toBeLessThanOrEqual(1);
  expect(metrics.clarity).toBeGreaterThanOrEqual(0);
  expect(metrics.clarity).toBeLessThanOrEqual(1);
  expect(metrics.quality).toBeGreaterThanOrEqual(0);
  expect(metrics.quality).toBeLessThanOrEqual(1);
};

/**
 * Validates protection metrics are within healthy ranges
 */
export const validateProtectionMetrics = (metrics: ProtectionMetrics) => {
  expect(metrics.stability).toBeGreaterThanOrEqual(0);
  expect(metrics.stability).toBeLessThanOrEqual(1);
  expect(metrics.resilience).toBeGreaterThanOrEqual(0);
  expect(metrics.resilience).toBeLessThanOrEqual(1);
  expect(metrics.integrity).toBeGreaterThanOrEqual(0);
  expect(metrics.integrity).toBeLessThanOrEqual(1);
  expect(metrics.immunity).toBeGreaterThanOrEqual(0);
  expect(metrics.immunity).toBeLessThanOrEqual(1);
};

/**
 * Verifies a flow state transition occurred as expected
 */
export const verifyFlowTransition = (
  before: FlowState,
  after: FlowState,
  expectedChanges: Partial<FlowState>
) => {
  // Verify unchanged properties
  expect(after.metrics).toEqual(before.metrics);
  expect(after.protected).toBe(before.protected);

  // Verify changed properties
  Object.entries(expectedChanges).forEach(([key, value]) => {
    expect(after[key as keyof FlowState]).toEqual(value);
  });

  // Verify transition timestamp updated
  expect(after.lastTransition).toBeGreaterThan(before.lastTransition);
};

/**
 * Custom matchers for enhanced testing
 */
expect.extend({
  toBeInRange(received: unknown, min: number, max: number) {
    const pass = typeof received === 'number' && received >= min && received <= max;
    return {
      message: () => pass
        ? `expected ${received} not to be within range ${min} - ${max}`
        : `expected ${received} to be within range ${min} - ${max}`,
      pass
    };
  }
}); 