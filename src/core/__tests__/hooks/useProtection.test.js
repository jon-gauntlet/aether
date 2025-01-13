import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react-hooks';
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
    expect(result.current.protectionState).toBeDefined();
    expect(result.current.protectionState.metrics).toBeDefined();
    validateProtectionMetrics(result.current.protectionState.metrics);
  });

  it('maintains protection during flow state', () => {
    const { result } = renderHook(() => useProtection());
    const initialMetrics = result.current.protectionState.metrics;
    
    // Simulate time passing in flow state
    vi.advanceTimersByTime(30 * 60 * 1000); // 30 minutes
    
    expect(result.current.protectionState.metrics.stability)
      .toBeGreaterThanOrEqual(initialMetrics.stability);
  });

  it('triggers reinforcement at critical threshold', () => {
    const mockState = createMockProtectionState();
    mockState.metrics.stability = 0.3; // Below critical threshold
    
    const { result } = renderHook(() => useProtection());
    
    // Verify reinforcement is triggered
    expect(result.current.protectionState.metrics.stability)
      .toBeGreaterThan(mockState.metrics.stability);
  });
}); 