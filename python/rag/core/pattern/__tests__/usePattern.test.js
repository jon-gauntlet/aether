import { renderHook, act } from '@testing-library/react-hooks';
import { usePattern } from '../usePattern';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('usePattern', () => {
  /** @type {Object} */
  const mockEnergy = {
    mental: 0.8,
    physical: 0.7,
    emotional: 0.9
  };

  /** @type {Object} */
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
          'flow',
          mockEnergy,
          mockMetrics,
          { tags: ['focus', 'coding'] }
        );

        expect(pattern).toMatchObject({
          state: 'evolving',
          flowState: 'flow',
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
        result.current.createPattern('flow', mockEnergy, mockMetrics);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData.patterns).toHaveLength(1);
    });
  });

  describe('Pattern Matching', () => {
    it('finds matching pattern based on energy levels', () => {
      const { result } = renderHook(() => usePattern());
      /** @type {Object} */
      let pattern;

      act(() => {
        pattern = result.current.createPattern(
          'flow',
          mockEnergy,
          mockMetrics
        );
      });

      act(() => {
        const match = result.current.findMatchingPattern(
          'flow',
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
  });
}); 