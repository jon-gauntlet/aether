import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useProtection } from '../../hooks/useProtection';
import { createMockProtectionState, validateProtectionMetrics } from '../utils/test-utils';

describe('useProtection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with default protection state', () => {
    const { result } = renderHook(() => useProtection());
    expect(result.current.protection).toBeDefined();
    expect(result.current.protection.metrics).toBeDefined();
    validateProtectionMetrics(result.current.protection.metrics);
  });

  it('maintains protection during flow state', () => {
    const { result } = renderHook(() => useProtection());
    const initialMetrics = result.current.protection.metrics;
    
    // Simulate time passing in flow state
    act(() => {
      vi.advanceTimersByTime(30 * 60 * 1000); // 30 minutes
      result.current.checkHealth();
    });
    
    expect(result.current.protection.metrics.stability)
      .toBeGreaterThanOrEqual(initialMetrics.stability * 0.95); // Allow for small degradation
  });

  it('triggers reinforcement at critical threshold', () => {
    const mockState = createMockProtectionState({
      metrics: {
        stability: 0.3,
        resilience: 0.3,
        integrity: 0.3,
        immunity: 0.3
      }
    });
    
    const { result } = renderHook(() => useProtection(mockState));
    
    act(() => {
      // Force a health check which should trigger reinforcement
      result.current.checkHealth();
    });
    
    // Verify reinforcement is triggered
    expect(result.current.protection.metrics.stability)
      .toBeGreaterThan(mockState.metrics.stability);
  });
}); 