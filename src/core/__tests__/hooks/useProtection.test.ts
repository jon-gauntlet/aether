import { renderHook, act } from '@testing-library/react-hooks';
import { useProtection } from '../../hooks/useProtection';
import { 
  createMockProtectionState,
  validateProtectionMetrics,
  wait
} from '../utils/test-utils';

describe('useProtection', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useProtection());
    expect(result.current.protection).toEqual(createMockProtectionState());
    validateProtectionMetrics(result.current.protection.metrics);
  });

  it('checks health and updates metrics', () => {
    const { result } = renderHook(() => useProtection());

    act(() => {
      jest.advanceTimersByTime(5 * 60 * 1000); // 5 minutes
      const metrics = result.current.checkHealth();
      validateProtectionMetrics(metrics);
    });

    expect(result.current.protection.lastCheck).toBeGreaterThan(0);
  });

  it('reinforces protection when metrics are low', () => {
    const { result } = renderHook(() => useProtection({
      metrics: {
        stability: 0.5,
        resilience: 0.5,
        integrity: 0.5,
        immunity: 0.5
      }
    }));

    act(() => {
      const metrics = result.current.reinforce(0.2);
      validateProtectionMetrics(metrics);
    });

    Object.values(result.current.protection.metrics).forEach(metric => {
      expect(metric).toBeGreaterThan(0.5);
    });
  });

  it('activates flow shield and boosts metrics', () => {
    const { result } = renderHook(() => useProtection());

    act(() => {
      result.current.activateFlowShield();
    });

    expect(result.current.protection.flowShieldActive).toBe(true);
    Object.values(result.current.protection.metrics).forEach(metric => {
      expect(metric).toBeGreaterThan(0.9);
    });
  });

  it('deactivates flow shield and adjusts metrics', () => {
    const { result } = renderHook(() => useProtection());

    act(() => {
      result.current.activateFlowShield();
      result.current.deactivateFlowShield();
    });

    expect(result.current.protection.flowShieldActive).toBe(false);
    validateProtectionMetrics(result.current.protection.metrics);
  });

  it('maintains minimum safe levels during degradation', () => {
    const { result } = renderHook(() => useProtection());

    act(() => {
      // Simulate long time passage
      jest.advanceTimersByTime(120 * 60 * 1000); // 2 hours
      result.current.checkHealth();
    });

    Object.values(result.current.protection.metrics).forEach(metric => {
      expect(metric).toBeGreaterThanOrEqual(0.7); // MIN_SAFE_LEVEL
    });
  });

  it('auto-checks health periodically', () => {
    const { result } = renderHook(() => useProtection());
    const initialMetrics = { ...result.current.protection.metrics };

    act(() => {
      jest.advanceTimersByTime(5 * 60 * 1000); // 5 minutes
    });

    expect(result.current.protection.lastCheck).toBeGreaterThan(0);
    expect(result.current.protection.metrics).not.toEqual(initialMetrics);
  });

  it('cleans up timer on unmount', () => {
    const { unmount } = renderHook(() => useProtection());
    unmount();

    // Verify timer is cleared
    const activeTimers = jest.getTimerCount();
    expect(activeTimers).toBe(0);
  });
}); 