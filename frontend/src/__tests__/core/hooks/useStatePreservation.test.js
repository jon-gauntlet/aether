import { renderHook, act } from '@testing-library/react-hooks';
import { useStatePreservation } from '../../../hooks/useStatePreservation';
import { useProtection } from '../../../hooks/useProtection';
import { DEFAULT_METRICS } from '../../../hooks/useProtection';

const mockFlowState = {
  active: true,
  type: 'HYPERFOCUS',
  intensity: 'high',
  metrics: {
    focus: 0.98,
    energy: 0.98,
    clarity: 0.99,
    velocity: 0.98,
    momentum: 0.98,
    resistance: 0.1,
    conductivity: 0.99,
    quality: 0.99
  },
  duration: 0,
  lastTransition: Date.now(),
  protected: true,
  quality: 0.98
};

const mockSpaceState = {
  type: 'sanctuary',
  active: true,
  flowState: mockFlowState,
  protection: {
    active: true,
    metrics: {
      stability: 0.98,
      resilience: 0.98,
      integrity: 0.98,
      immunity: 0.98
    },
    lastCheck: Date.now(),
    violations: 0,
    flowShieldActive: true
  },
  lastTransition: Date.now()
};

describe('useStatePreservation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('preserves high-quality flow states', () => {
    const { result } = renderHook(() => useStatePreservation());
    const { result: protectionResult } = renderHook(() => useProtection({
      flowShieldActive: true,
      metrics: {
        stability: 0.98,
        resilience: 0.98,
        integrity: 0.98,
        immunity: 0.98
      }
    }));

    act(() => {
      const success = result.current.preserveState(
        mockFlowState,
        mockSpaceState,
        protectionResult.current.protection
      );
      expect(success).toBe(true);
    });

    const recoveryPoints = result.current.getRecoveryPoints();
    expect(recoveryPoints.length).toBe(1);
    
    const restored = result.current.restoreState(recoveryPoints[0]);
    expect(restored?.flowState).toEqual(mockFlowState);
  });

  it('maintains state coherence during intensive periods', () => {
    const { result } = renderHook(() => useStatePreservation());
    const { result: protectionResult } = renderHook(() => useProtection({
      flowShieldActive: true,
      metrics: {
        stability: 0.98,
        resilience: 0.98,
        integrity: 0.98,
        immunity: 0.98
      }
    }));

    // Simulate 30 minute development session
    act(() => {
      vi.advanceTimersByTime(30 * 60 * 1000);
      protectionResult.current.checkHealth();
      
      const success = result.current.preserveState(
        mockFlowState,
        mockSpaceState,
        protectionResult.current.protection
      );
      expect(success).toBe(true);
    });

    const recoveryPoints = result.current.getRecoveryPoints();
    const restored = result.current.restoreState(recoveryPoints[0]);
    expect(restored?.metrics.coherence).toBeGreaterThan(0.95);
    expect(restored?.metrics.stability).toBeGreaterThan(0.95);
  });
}); 