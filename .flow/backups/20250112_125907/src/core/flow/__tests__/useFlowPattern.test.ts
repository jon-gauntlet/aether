import { renderHook, act } from '@testing-library/react-hooks';
import { useFlowPattern } from '../useFlowPattern';
import { useFlow } from '../useFlow';
import { usePattern } from '../../pattern/usePattern';
import { PatternState } from '../../pattern/types';
import { FlowState } from '../../../types/base';

// Mock hooks
jest.mock('../useFlow');
jest.mock('../../pattern/usePattern');

describe('useFlowPattern', () => {
  const mockMetrics = {
    efficiency: 0.8,
    sustainability: 0.7,
    recovery: 0.6,
    adaptability: 0.85,
    stability: 0.75
  };

  const mockPattern = {
    id: '1',
    name: 'Test Pattern',
    flowState: FlowState.FLOW,
    energyLevels: {
      mental: 0.8,
      physical: 0.7,
      emotional: 0.9
    },
    metrics: mockMetrics,
    state: PatternState.EVOLVING,
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
    (useFlow as jest.Mock).mockReturnValue({
      flow: {
        state: 'natural',
        metrics: { efficiency: 0.8, duration: 0, transitions: 0 },
        protection: { level: 1, type: 'natural', strength: 1 }
      },
      stream: {
        measure: jest.fn(),
        transition: jest.fn()
      },
      transition: jest.fn(),
      setMode: jest.fn(),
      deepen: jest.fn(),
      protect: jest.fn()
    });

    // Mock usePattern
    (usePattern as jest.Mock).mockReturnValue({
      pattern: mockPattern,
      updatePattern: jest.fn(),
      evolvePattern: jest.fn()
    });
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

      expect(result.current.activePattern?.state).toBe(PatternState.EVOLVING);
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
      (useFlow as jest.Mock).mockReturnValue({
        ...useFlow(),
        flow: { ...useFlow().flow, state: 'flow' }
      });
      rerender();

      expect(result.current.isLearning).toBe(false);
    });
  });
}); 