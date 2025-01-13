import { renderHook, act } from '@testing-library/react-hooks';
import { useStatePreservation } from '../../hooks/useStatePreservation';
import { useProtection } from '../../hooks/useProtection';
import { DEFAULT_METRICS } from '../../hooks/useProtection';
import { 
  FlowState, 
  FlowMetrics,
  FlowStateType
} from '../../types/flow/types';
import { SpaceState } from '../../types/space/types';

const mockFlowState: FlowState = {
  active: true,
  type: FlowStateType.HYPERFOCUS,
  intensity: 'high',
  metrics: {
    focus: 0.95,
    energy: 0.9,
    clarity: 0.92,
    velocity: 0.93,
    momentum: 0.91,
    resistance: 0.1,
    conductivity: 0.94,
    quality: 0.95
  },
  duration: 0,
  lastTransition: Date.now(),
  protected: true,
  quality: 0.93
};

const mockSpaceState: SpaceState = {
  type: 'sanctuary',
  active: true,
  flowState: mockFlowState,
  protection: {
    active: true,
    metrics: DEFAULT_METRICS,
    lastCheck: Date.now(),
    violations: 0,
    flowShieldActive: true
  },
  lastTransition: Date.now()
};

describe('useStatePreservation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('preserves high-quality flow states', () => {
    const { result } = renderHook(() => useStatePreservation());
    const { result: protectionResult } = renderHook(() => useProtection({
      flowShieldActive: true,
      metrics: DEFAULT_METRICS
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
      metrics: DEFAULT_METRICS
    }));

    // Simulate 30 minute development session
    act(() => {
      jest.advanceTimersByTime(30 * 60 * 1000);
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
    expect(restored?.metrics.coherence).toBeGreaterThan(0.9);
    expect(restored?.metrics.stability).toBeGreaterThan(0.9);
  });
}); 