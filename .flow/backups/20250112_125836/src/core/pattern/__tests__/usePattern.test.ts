import { renderHook, act } from '@testing-library/react-hooks';
import { usePattern } from '../usePattern';
import { FlowState } from '../../types/base';
import { PatternState, EnergyPattern } from '../types';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('usePattern', () => {
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

  beforeEach(() => {
    mockLocalStorage.clear();
    mockLocalStorage.getItem.mockReset();
    mockLocalStorage.setItem.mockReset();
  });

  describe('Pattern Creation', () => {
    it('creates a new pattern with correct initial state', () => {
      const { result } = renderHook(() => usePattern());

      act(() => {
        const pattern = result.current.createPattern(
          FlowState.FLOW,
          mockEnergy,
          mockMetrics,
          { tags: ['focus', 'coding'] }
        );

        expect(pattern).toMatchObject({
          state: PatternState.EVOLVING,
          flowState: FlowState.FLOW,
          energyLevels: mockEnergy,
          metrics: mockMetrics,
          context: {
            tags: ['focus', 'coding']
          }
        });
        expect(pattern.id).toBeDefined();
        expect(pattern.evolution.version).toBe(1);
        expect(pattern.evolution.history).toHaveLength(0);
      });
    });

    it('persists new pattern to storage', () => {
      const { result } = renderHook(() => usePattern());

      act(() => {
        result.current.createPattern(FlowState.FLOW, mockEnergy, mockMetrics);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData.patterns).toHaveLength(1);
    });
  });

  describe('Pattern Matching', () => {
    it('finds matching pattern based on energy levels', () => {
      const { result } = renderHook(() => usePattern());
      let pattern: EnergyPattern;

      act(() => {
        pattern = result.current.createPattern(
          FlowState.FLOW,
          mockEnergy,
          mockMetrics
        );
      });

      act(() => {
        const match = result.current.findMatchingPattern(
          FlowState.FLOW,
          {
            mental: 0.85,
            physical: 0.75,
            emotional: 0.85
          }
        );

        expect(match).toBeDefined();
        expect(match?.pattern.id).toBe(pattern.id);
        expect(match?.confidence).toBeGreaterThan(0.7);
      });
    });

    it('returns null when no matching pattern found', () => {
      const { result } = renderHook(() => usePattern());

      act(() => {
        result.current.createPattern(FlowState.FLOW, mockEnergy, mockMetrics);
      });

      act(() => {
        const match = result.current.findMatchingPattern(
          FlowState.FLOW,
          {
            mental: 0.2,
            physical: 0.2,
            emotional: 0.2
          }
        );

        expect(match).toBeNull();
      });
    });
  });

  describe('Pattern Evolution', () => {
    it('evolves pattern with success', () => {
      const { result } = renderHook(() => usePattern());
      let pattern: EnergyPattern;

      act(() => {
        pattern = result.current.createPattern(
          FlowState.FLOW,
          mockEnergy,
          mockMetrics
        );
      });

      act(() => {
        const evolved = result.current.evolvePattern(
          pattern,
          {
            energyLevels: {
              mental: 0.9,
              physical: 0.8,
              emotional: 0.9
            }
          },
          true
        );

        expect(evolved.state).toBe(PatternState.STABLE);
        expect(evolved.evolution.version).toBe(2);
        expect(evolved.evolution.history).toHaveLength(1);
        expect(evolved.evolution.history[0].success).toBe(true);
      });
    });

    it('keeps pattern evolving on failure', () => {
      const { result } = renderHook(() => usePattern());
      let pattern: EnergyPattern;

      act(() => {
        pattern = result.current.createPattern(
          FlowState.FLOW,
          mockEnergy,
          mockMetrics
        );
      });

      act(() => {
        const evolved = result.current.evolvePattern(
          pattern,
          {
            energyLevels: {
              mental: 0.7,
              physical: 0.6,
              emotional: 0.8
            }
          },
          false
        );

        expect(evolved.state).toBe(PatternState.EVOLVING);
        expect(evolved.evolution.history[0].success).toBe(false);
      });
    });
  });

  describe('Pattern Protection', () => {
    it('protects stable patterns', () => {
      const { result } = renderHook(() => usePattern());
      let pattern: EnergyPattern;

      act(() => {
        pattern = result.current.createPattern(
          FlowState.FLOW,
          mockEnergy,
          mockMetrics
        );
      });

      act(() => {
        result.current.protectPattern(pattern);
      });

      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[1][1]);
      expect(savedData.patterns[0].state).toBe(PatternState.PROTECTED);
    });

    it('excludes protected patterns from matching', () => {
      const { result } = renderHook(() => usePattern());
      let pattern: EnergyPattern;

      act(() => {
        pattern = result.current.createPattern(
          FlowState.FLOW,
          mockEnergy,
          mockMetrics
        );
      });

      act(() => {
        result.current.protectPattern(pattern);
      });

      act(() => {
        const match = result.current.findMatchingPattern(
          FlowState.FLOW,
          mockEnergy
        );
        expect(match).toBeNull();
      });
    });
  });

  describe('Pattern Cleanup', () => {
    it('removes unstable patterns', () => {
      const { result } = renderHook(() => usePattern());

      act(() => {
        // Create evolving pattern
        result.current.createPattern(FlowState.FLOW, mockEnergy, mockMetrics);

        // Create and stabilize pattern
        const pattern = result.current.createPattern(
          FlowState.HYPERFOCUS,
          mockEnergy,
          mockMetrics
        );
        result.current.evolvePattern(pattern, {}, true);
      });

      act(() => {
        result.current.clearUnstablePatterns();
      });

      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[2][1]);
      expect(savedData.patterns).toHaveLength(1);
      expect(savedData.patterns[0].state).toBe(PatternState.STABLE);
    });
  });
}); 