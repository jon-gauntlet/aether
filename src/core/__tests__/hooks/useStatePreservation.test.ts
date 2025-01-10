import { renderHook, act } from '@testing-library/react-hooks';
import { useStatePreservation } from '../../hooks/useStatePreservation';
import { 
  createMockFlowState,
  createMockProtectionState,
  wait
} from '../utils/test-utils';
import { SpaceState } from '../../types/space/types';

const createMockSpaceState = (): SpaceState => ({
  type: 'sanctuary',
  active: true,
  flowState: createMockFlowState(),
  protection: createMockProtectionState(),
  lastTransition: Date.now()
});

describe('useStatePreservation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useStatePreservation());
    expect(result.current.getRecoveryPoints()).toEqual([]);
  });

  it('preserves high-quality states', () => {
    const { result } = renderHook(() => useStatePreservation());
    const flowState = createMockFlowState({
      active: true,
      metrics: {
        velocity: 0.95,
        momentum: 0.95,
        resistance: 0.1,
        conductivity: 0.95,
        focus: 0.95,
        energy: 0.95,
        clarity: 0.95,
        quality: 0.95
      }
    });
    const spaceState = createMockSpaceState();
    const protection = createMockProtectionState({
      metrics: {
        stability: 0.95,
        resilience: 0.95,
        integrity: 0.95,
        immunity: 0.95
      }
    });

    act(() => {
      const preserved = result.current.preserveState(flowState, spaceState, protection);
      expect(preserved).toBe(true);
    });

    const recoveryPoints = result.current.getRecoveryPoints();
    expect(recoveryPoints.length).toBe(1);
  });

  it('does not preserve low-quality states', () => {
    const { result } = renderHook(() => useStatePreservation());
    const flowState = createMockFlowState({
      active: true,
      metrics: {
        velocity: 0.7,
        momentum: 0.7,
        resistance: 0.3,
        conductivity: 0.7,
        focus: 0.7,
        energy: 0.7,
        clarity: 0.7,
        quality: 0.7
      }
    });
    const spaceState = createMockSpaceState();
    const protection = createMockProtectionState({
      metrics: {
        stability: 0.7,
        resilience: 0.7,
        integrity: 0.7,
        immunity: 0.7
      }
    });

    act(() => {
      const preserved = result.current.preserveState(flowState, spaceState, protection);
      expect(preserved).toBe(false);
    });

    const recoveryPoints = result.current.getRecoveryPoints();
    expect(recoveryPoints.length).toBe(0);
  });

  it('restores state from recovery point', () => {
    const { result } = renderHook(() => useStatePreservation());
    const flowState = createMockFlowState({
      active: true,
      metrics: {
        velocity: 0.95,
        momentum: 0.95,
        resistance: 0.1,
        conductivity: 0.95,
        focus: 0.95,
        energy: 0.95,
        clarity: 0.95,
        quality: 0.95
      }
    });
    const spaceState = createMockSpaceState();
    const protection = createMockProtectionState({
      metrics: {
        stability: 0.95,
        resilience: 0.95,
        integrity: 0.95,
        immunity: 0.95
      }
    });

    act(() => {
      result.current.preserveState(flowState, spaceState, protection);
    });

    const recoveryPoints = result.current.getRecoveryPoints();
    const restored = result.current.restoreState(recoveryPoints[0]);

    expect(restored).not.toBeNull();
    expect(restored?.flowState).toEqual(flowState);
    expect(restored?.spaceState).toEqual(spaceState);
    expect(restored?.protection).toEqual({
      ...protection,
      lastCheck: expect.any(Number)
    });
  });

  it('maintains maximum number of backups', () => {
    const { result } = renderHook(() => useStatePreservation());
    const flowState = createMockFlowState({
      active: true,
      metrics: {
        velocity: 0.95,
        momentum: 0.95,
        resistance: 0.1,
        conductivity: 0.95,
        focus: 0.95,
        energy: 0.95,
        clarity: 0.95,
        quality: 0.95
      }
    });
    const spaceState = createMockSpaceState();
    const protection = createMockProtectionState({
      metrics: {
        stability: 0.95,
        resilience: 0.95,
        integrity: 0.95,
        immunity: 0.95
      }
    });

    act(() => {
      // Create more than MAX_BACKUPS states
      for (let i = 0; i < 15; i++) {
        result.current.preserveState(flowState, spaceState, protection);
        jest.advanceTimersByTime(60 * 1000); // 1 minute
      }
    });

    const recoveryPoints = result.current.getRecoveryPoints();
    expect(recoveryPoints.length).toBeLessThanOrEqual(12); // MAX_BACKUPS
  });
}); 