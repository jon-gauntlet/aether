import { renderHook, act } from '@testing-library/react-hooks';
import { useFlowState } from '../../hooks/useFlowState';
import { FlowStateType } from '../../types/flow/types';
import { 
  createMockFlowState,
  validateFlowMetrics,
  wait
} from '../utils/test-utils';

jest.mock('../../hooks/useProtection', () => ({
  useProtection: () => ({
    protection: {
      active: true,
      metrics: {
        stability: 0.9,
        resilience: 0.85,
        integrity: 0.9,
        immunity: 0.85
      },
      lastCheck: Date.now(),
      violations: 0,
      flowShieldActive: false
    },
    checkHealth: () => ({
      stability: 0.9,
      resilience: 0.85,
      integrity: 0.9,
      immunity: 0.85
    })
  })
}));

describe('useFlowState', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useFlowState());
    expect(result.current.flowState).toEqual(createMockFlowState());
  });

  it('starts flow when protection metrics are good', async () => {
    const { result } = renderHook(() => useFlowState());

    await act(async () => {
      const success = await result.current.startFlow();
      expect(success).toBe(true);
    });

    expect(result.current.flowState.active).toBe(true);
    expect(result.current.flowState.type).toBe(FlowStateType.FOCUS);
    expect(result.current.flowState.protected).toBe(true);
    validateFlowMetrics(result.current.flowState.metrics);
  });

  it('updates metrics during flow', async () => {
    const { result } = renderHook(() => useFlowState());

    await act(async () => {
      await result.current.startFlow();
      jest.advanceTimersByTime(5 * 60 * 1000); // 5 minutes
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
        jest.advanceTimersByTime(5 * 60 * 1000); // 5 minutes
        result.current.updateMetrics();
      }
    });

    expect(result.current.flowState.type).toBe(FlowStateType.HYPERFOCUS);
    validateFlowMetrics(result.current.flowState.metrics);
  });

  it('ends flow and transitions to recovery', async () => {
    const { result } = renderHook(() => useFlowState());

    await act(async () => {
      await result.current.startFlow();
      result.current.endFlow();
    });

    expect(result.current.flowState.active).toBe(false);
    expect(result.current.flowState.type).toBe(FlowStateType.RECOVERING);
    expect(result.current.flowState.protected).toBe(false);
  });

  it('cleans up timers on unmount', async () => {
    const { result, unmount } = renderHook(() => useFlowState());

    await act(async () => {
      await result.current.startFlow();
    });

    unmount();

    // Verify timers are cleared
    const activeTimers = jest.getTimerCount();
    expect(activeTimers).toBe(0);
  });
}); 