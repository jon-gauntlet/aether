/**
 * @typedef {'FOCUS' | 'HYPERFOCUS' | 'RECOVERING' | 'RESTING' | 'EXHAUSTED'} FlowStateType
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateFlowMetrics } from '../utils/test-utils';

const mockUseProtection = vi.fn(() => ({
  protection: {
    isActive: true,
    metrics: {
      integrity: 0.8,
      shields: 0.7,
      recovery: 0.9
    }
  },
  checkHealth: () => ({
    integrity: 0.8,
    shields: 0.7,
    recovery: 0.9
  })
}));

vi.mock('../../hooks/useProtection', () => ({
  useProtection: () => mockUseProtection()
}));

import { useFlowState } from '../../hooks/useFlowState';

describe('useFlowState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useFlowState());
    expect(result.current.flowState).toBeDefined();
    expect(result.current.flowState.type).toBe('RESTING');
    expect(result.current.flowState.active).toBe(false);
  });

  it('starts flow when protection metrics are good', async () => {
    const { result } = renderHook(() => useFlowState());

    await act(async () => {
      const success = await result.current.startFlow();
      expect(success).toBe(true);
    });

    expect(result.current.flowState.active).toBe(true);
    expect(result.current.flowState.type).toBe('FOCUS');
    expect(result.current.flowState.protected).toBe(true);
    validateFlowMetrics(result.current.flowState.metrics);
  });

  it('updates metrics during flow', async () => {
    const { result } = renderHook(() => useFlowState());

    await act(async () => {
      await result.current.startFlow();
      vi.advanceTimersByTime(5 * 60 * 1000); // 5 minutes
      result.current.updateMetrics();
    });

    validateFlowMetrics(result.current.flowState.metrics);
    expect(result.current.flowState.quality).toBeGreaterThan(0);
  });

  it('transitions through flow states based on metrics', async () => {
    const { result } = renderHook(() => useFlowState());

    await act(async () => {
      await result.current.startFlow();
      
      // Simulate high performance
      for (let i = 0; i < 6; i++) {
        vi.advanceTimersByTime(5 * 60 * 1000); // 5 minutes
        result.current.updateMetrics();
      }
    });

    expect(result.current.flowState.type).toBe('HYPERFOCUS');
    validateFlowMetrics(result.current.flowState.metrics);
  });

  it('ends flow and transitions to recovery', async () => {
    const { result } = renderHook(() => useFlowState());

    await act(async () => {
      await result.current.startFlow();
      result.current.endFlow();
    });

    expect(result.current.flowState.active).toBe(false);
    expect(result.current.flowState.type).toBe('RECOVERING');
    expect(result.current.flowState.protected).toBe(false);
  });

  it('cleans up timers on unmount', async () => {
    const { result, unmount } = renderHook(() => useFlowState());

    await act(async () => {
      await result.current.startFlow();
    });

    unmount();

    // Verify timers are cleared
    const activeTimers = vi.getTimerCount();
    expect(activeTimers).toBe(0);
  });
}); 