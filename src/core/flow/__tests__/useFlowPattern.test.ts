import { renderHook, act } from '@testing-library/react-hooks';
import { useFlowPattern } from '../useFlowPattern';
import { useFlow } from '../useFlow';
import { usePattern } from '../../pattern/usePattern';
import { FlowState } from '../../types/base';
import { PatternState, EnergyPattern } from '../../pattern/types';

// Mock hooks
jest.mock('../useFlow');
jest.mock('../../pattern/usePattern');

describe('useFlowPattern', () => {
  const mockEnergy = {
    mental: 0.8,
    physical: 0.7,
    emotional: 0.9
  };

  const mockMetrics = {
    efficiency: 0.8,
    sustainability: 0.7,
    recovery: 0.6
  };

  const mockPattern: EnergyPattern = {
    id: 'test-pattern',
    state: PatternState.EVOLVING,
    flowState: FlowState.FLOW,
    energyLevels: mockEnergy,
    metrics: mockMetrics,
    context: {
      timestamp: new Date(),
      duration: 0,
      tags: [],
      triggers: [],
      notes: ''
    },
    evolution: {
      version: 1,
      history: []
    }
  };

  beforeEach(() => {
    // Mock useFlow
    (useFlow as jest.Mock).mockReturnValue({
      currentState: FlowState.FOCUS,
      metrics: { efficiency: 0.8, duration: 0, transitions: 0 },
      canTransition: jest.fn().mockReturnValue(true),
      optimize: jest.fn().mockReturnValue(true),
      isEnergyLow: jest.fn().mockReturnValue(false)
    });

    // Mock usePattern
    (usePattern as jest.Mock).mockReturnValue({
      createPattern: jest.fn().mockReturnValue(mockPattern),
      findMatchingPattern: jest.fn(),
      evolvePattern: jest.fn().mockReturnValue(mockPattern),
      protectPattern: jest.fn(),
      clearUnstablePatterns: jest.fn()
    });
  });

  describe('Pattern Detection', () => {
    it('detects and matches patterns', () => {
      const mockMatch = {
        pattern: mockPattern,
        confidence: 0.8,
        predictedEnergy: mockEnergy,
        estimatedDuration: 3600
      };

      (usePattern as jest.Mock).mockReturnValue({
        ...usePattern(),
        findMatchingPattern: jest.fn().mockReturnValue(mockMatch)
      });

      const { result } = renderHook(() => useFlowPattern());

      act(() => {
        const match = result.current.detectPattern(mockEnergy, mockMetrics);
        expect(match).toBeDefined();
        expect(match?.confidence).toBe(0.8);
        expect(result.current.confidence).toBe(0.8);
      });
    });

    it('handles no pattern match', () => {
      (usePattern as jest.Mock).mockReturnValue({
        ...usePattern(),
        findMatchingPattern: jest.fn().mockReturnValue(null)
      });

      const { result } = renderHook(() => useFlowPattern());

      act(() => {
        const match = result.current.detectPattern(mockEnergy, mockMetrics);
        expect(match).toBeNull();
        expect(result.current.confidence).toBe(0);
      });
    });
  });

  describe('Pattern Optimization', () => {
    it('optimizes flow based on pattern', () => {
      const mockOptimize = jest.fn().mockReturnValue(true);
      (useFlow as jest.Mock).mockReturnValue({
        ...useFlow(),
        optimize: mockOptimize
      });

      const { result } = renderHook(() => useFlowPattern());

      act(() => {
        const success = result.current.optimizeWithPattern(
          mockPattern,
          mockEnergy,
          mockMetrics
        );
        expect(success).toBe(true);
        expect(mockOptimize).toHaveBeenCalledWith(FlowState.FLOW);
      });
    });

    it('prevents optimization of protected patterns', () => {
      const protectedPattern = {
        ...mockPattern,
        state: PatternState.PROTECTED
      };

      const { result } = renderHook(() => useFlowPattern());

      act(() => {
        const success = result.current.optimizeWithPattern(
          protectedPattern,
          mockEnergy,
          mockMetrics
        );
        expect(success).toBe(false);
      });
    });
  });

  describe('Pattern Learning', () => {
    it('learns from current state with no active pattern', () => {
      const mockCreatePattern = jest.fn().mockReturnValue(mockPattern);
      (usePattern as jest.Mock).mockReturnValue({
        ...usePattern(),
        createPattern: mockCreatePattern
      });

      const { result } = renderHook(() => useFlowPattern());

      act(() => {
        result.current.learnCurrentState(mockEnergy, mockMetrics);
        expect(mockCreatePattern).toHaveBeenCalled();
        expect(result.current.isLearning).toBe(true);
      });
    });

    it('evolves active pattern', () => {
      const mockEvolvePattern = jest.fn().mockReturnValue(mockPattern);
      (usePattern as jest.Mock).mockReturnValue({
        ...usePattern(),
        evolvePattern: mockEvolvePattern
      });

      const { result } = renderHook(() => useFlowPattern());

      // Set active pattern
      act(() => {
        result.current.optimizeWithPattern(mockPattern, mockEnergy, mockMetrics);
      });

      act(() => {
        result.current.learnCurrentState(mockEnergy, mockMetrics);
        expect(mockEvolvePattern).toHaveBeenCalled();
      });
    });
  });

  describe('Pattern Protection', () => {
    it('protects successful patterns', () => {
      const successfulPattern = {
        ...mockPattern,
        evolution: {
          version: 1,
          history: [
            { timestamp: new Date(), changes: {}, success: true },
            { timestamp: new Date(), changes: {}, success: true },
            { timestamp: new Date(), changes: {}, success: true }
          ]
        }
      };

      const mockProtectPattern = jest.fn();
      (usePattern as jest.Mock).mockReturnValue({
        ...usePattern(),
        protectPattern: mockProtectPattern
      });

      const { result } = renderHook(() => useFlowPattern());

      act(() => {
        const protected_ = result.current.protectSuccessfulPattern(
          successfulPattern,
          0.7
        );
        expect(protected_).toBe(true);
        expect(mockProtectPattern).toHaveBeenCalled();
      });
    });

    it('does not protect unsuccessful patterns', () => {
      const unsuccessfulPattern = {
        ...mockPattern,
        evolution: {
          version: 1,
          history: [
            { timestamp: new Date(), changes: {}, success: false },
            { timestamp: new Date(), changes: {}, success: false },
            { timestamp: new Date(), changes: {}, success: true }
          ]
        }
      };

      const mockProtectPattern = jest.fn();
      (usePattern as jest.Mock).mockReturnValue({
        ...usePattern(),
        protectPattern: mockProtectPattern
      });

      const { result } = renderHook(() => useFlowPattern());

      act(() => {
        const protected_ = result.current.protectSuccessfulPattern(
          unsuccessfulPattern,
          0.7
        );
        expect(protected_).toBe(false);
        expect(mockProtectPattern).not.toHaveBeenCalled();
      });
    });
  });

  describe('State Management', () => {
    it('resets learning state on flow state change', () => {
      const { result, rerender } = renderHook(() => useFlowPattern());

      // Start learning
      act(() => {
        result.current.learnCurrentState(mockEnergy, mockMetrics);
      });
      expect(result.current.isLearning).toBe(true);

      // Change flow state
      (useFlow as jest.Mock).mockReturnValue({
        ...useFlow(),
        currentState: FlowState.FLOW
      });
      rerender();

      expect(result.current.isLearning).toBe(false);
    });
  });
}); 