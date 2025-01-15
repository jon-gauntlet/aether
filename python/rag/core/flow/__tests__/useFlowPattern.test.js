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
      stream: {
        measure: vi.fn(),
        transition: vi.fn()
      },
      transition: vi.fn(),
      setMode: vi.fn(),
      deepen: vi.fn(),
      protect: vi.fn()
    });

    // Mock usePattern
    usePattern.mockReturnValue({
      pattern: mockPattern,
      updatePattern: vi.fn(),
      evolvePattern: vi.fn()
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Pattern Learning', () => {
    it('learns from current state', () => {
      const { result } = renderHook(() => useFlowPattern());

      act(() => {
        result.current.learnCurrentState(mockPattern.energyLevels, mockPattern.metrics);
      });

      expect(result.current.isLearning).toBe(true);
    });

    it('evolves pattern based on metrics', () => {
      const { result } = renderHook(() => useFlowPattern());

      act(() => {
        result.current.learnCurrentState(mockPattern.energyLevels, mockPattern.metrics);
      });

      expect(result.current.activePattern?.state).toBe('evolving');
    });
  });

  describe('State Management', () => {
    it('resets learning state on flow state change', () => {
      const { result, rerender } = renderHook(() => useFlowPattern());

      // Start learning
      act(() => {
        result.current.learnCurrentState(mockPattern.energyLevels, mockPattern.metrics);
      });
      expect(result.current.isLearning).toBe(true);

      // Change flow state
      useFlow.mockReturnValue({
        ...useFlow(),
        flow: { ...useFlow().flow, state: 'focus' }
      });
      rerender();

      expect(result.current.isLearning).toBe(false);
    });
  });
}); 