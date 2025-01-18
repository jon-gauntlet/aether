import { renderHook, act } from '@testing-library/react-hooks';
import { useFlowPattern } from '../useFlowPattern';
import { useFlow } from '../useFlow';
import { usePattern } from '../../pattern/usePattern';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock hooks
vi.mock('../useFlow');
vi.mock('../../pattern/usePattern');

describe('useFlowPattern', () => {
  /** @type {Object} */
  const mockMetrics = {
    efficiency: 0.8,
    sustainability: 0.7,
    recovery: 0.6,
    adaptability: 0.85,
    stability: 0.75
  };

  /** @type {Object} */
  const mockPattern = {
    id: '1',
    name: 'Test Pattern',
    flowState: 'flow',
    energyLevels: {
      mental: 0.8,
      physical: 0.7,
      emotional: 0.9
    },
    metrics: mockMetrics,
    state: 'evolving',
    evolution: {
      version: 1,
      history: [{
        timestamp: new Date(),
        changes: {},
        success: true
      }]
    }
  };

  beforeEach(() => {
    // Mock useFlow
    useFlow.mockReturnValue({
      flow: {
        state: 'natural',
        metrics: { efficiency: 0.8, duration: 0, transitions: 0 },
        protection: { level: 1, type: 'natural', strength: 1 }
      },
      setFlow: vi.fn()
    });

    // Mock usePattern
    usePattern.mockReturnValue({
      pattern: mockPattern,
      updatePattern: vi.fn(),
      createPattern: vi.fn()
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Pattern Learning', () => {
    it('learns from current state', () => {
      const { result } = renderHook(() => useFlowPattern({ state: 'flow' }));

      act(() => {
        result.current.learnCurrentState(mockPattern.energyLevels, mockPattern.metrics);
      });

      expect(result.current.isLearning).toBe(true);
      expect(result.current.activePattern).toEqual({
        energyLevels: mockPattern.energyLevels,
        metrics: mockPattern.metrics,
        state: 'evolving',
        confidence: 0
      });
    });

    it('evolves pattern based on metrics', () => {
      const { result } = renderHook(() => useFlowPattern({ state: 'flow' }));

      act(() => {
        result.current.learnCurrentState(mockPattern.energyLevels, mockPattern.metrics);
      });

      const newMetrics = { efficiency: 0.9 };
      act(() => {
        result.current.evolvePattern(newMetrics);
      });

      expect(result.current.activePattern).toEqual({
        energyLevels: mockPattern.energyLevels,
        metrics: { ...mockPattern.metrics, ...newMetrics },
        state: 'evolving',
        confidence: 0.1
      });
    });
  });

  describe('State Management', () => {
    it('resets learning state on flow state change', () => {
      const { result, rerender } = renderHook(
        (props) => useFlowPattern(props),
        { initialProps: { state: 'flow' } }
      );

      act(() => {
        result.current.learnCurrentState(mockPattern.energyLevels, mockPattern.metrics);
      });

      expect(result.current.isLearning).toBe(true);

      // Change flow state
      rerender({ state: 'recovery' });

      expect(result.current.isLearning).toBe(false);
      expect(result.current.activePattern).toBeNull();
    });
  });
}); 