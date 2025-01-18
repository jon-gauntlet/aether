import { renderHook, act } from '@testing-library/react-hooks';
import { useAutonomic } from '../useAutonomic';
import { AutonomicSystem } from '../index';
import { useDeployment } from '../../../core/protection/DeployGuard';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { firstValueFrom } from 'rxjs';

// Mock dependencies
vi.mock('../../protection/DeployGuard');

describe('useAutonomic', () => {
  const mockSystem = {
    observeFlow: vi.fn(),
    updateField: vi.fn(),
    updateConsciousness: vi.fn(),
    activate: vi.fn(),
    synchronize: vi.fn()
  };

  const mockFlowSubject = {
    subscribe: vi.fn(),
    unsubscribe: vi.fn()
  };

  beforeEach(() => {
    mockSystem.observeFlow.mockReturnValue({
      subscribe: (callback) => {
        mockFlowSubject.subscribe = callback;
        return { unsubscribe: mockFlowSubject.unsubscribe };
      }
    });

    useDeployment.mockReturnValue({ isProtected: true });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default values when no props provided', () => {
      const { result } = renderHook(() => useAutonomic());

      expect(result.current.fieldState).toEqual({
        id: 'default',
        type: 'energy',
        level: 70,
        isActive: true
      });

      expect(result.current.consciousnessState).toEqual({
        id: 'default',
        awarenessLevel: 80,
        isCoherent: true
      });

      expect(result.current.isActive).toBe(false);
    });

    it('should initialize with provided field and consciousness states', () => {
      const initialProps = {
        field: {
          id: 'test',
          type: 'focus',
          level: 90,
          isActive: true
        },
        consciousness: {
          id: 'test',
          awarenessLevel: 95,
          isCoherent: true
        }
      };

      const { result } = renderHook(() => useAutonomic(undefined, initialProps));

      expect(result.current.fieldState).toEqual(initialProps.field);
      expect(result.current.consciousnessState).toEqual(initialProps.consciousness);
    });

    it('should handle partial initial props', () => {
      const partialProps = {
        field: { level: 85 }
      };

      const { result } = renderHook(() => useAutonomic(undefined, partialProps));

      expect(result.current.fieldState).toEqual({
        id: 'default',
        type: 'energy',
        level: 85,
        isActive: true
      });

      expect(result.current.consciousnessState).toEqual({
        id: 'default',
        awarenessLevel: 80,
        isCoherent: true
      });
    });
  });

  describe('State Updates', () => {
    it('should update field state', () => {
      const { result } = renderHook(() => useAutonomic(mockSystem));

      act(() => {
        result.current.updateFieldState({ level: 85 });
      });

      expect(result.current.fieldState.level).toBe(85);
      expect(mockSystem.updateField).toHaveBeenCalledWith({ level: 85 });
    });

    it('should update consciousness state', () => {
      const { result } = renderHook(() => useAutonomic(mockSystem));

      act(() => {
        result.current.updateConsciousnessState({ awarenessLevel: 90 });
      });

      expect(result.current.consciousnessState.awarenessLevel).toBe(90);
      expect(mockSystem.updateConsciousness).toHaveBeenCalledWith({ awarenessLevel: 90 });
    });

    it('should preserve unmodified state properties', () => {
      const { result } = renderHook(() => useAutonomic(mockSystem));
      const originalField = { ...result.current.fieldState };

      act(() => {
        result.current.updateFieldState({ level: 85 });
      });

      expect(result.current.fieldState).toEqual({
        ...originalField,
        level: 85
      });
    });

    it('should handle multiple state updates', () => {
      const { result } = renderHook(() => useAutonomic(mockSystem));

      act(() => {
        result.current.updateFieldState({ level: 85 });
        result.current.updateFieldState({ type: 'focus' });
      });

      expect(result.current.fieldState).toEqual({
        id: 'default',
        type: 'focus',
        level: 85,
        isActive: true
      });
    });
  });

  describe('System Control', () => {
    it('should activate the autonomic system', () => {
      const { result } = renderHook(() => useAutonomic(mockSystem));

      act(() => {
        result.current.activateAutonomic();
      });

      expect(result.current.isActive).toBe(true);
      expect(mockSystem.activate).toHaveBeenCalled();
    });

    it('should synchronize states', () => {
      const { result } = renderHook(() => useAutonomic(mockSystem));

      act(() => {
        result.current.synchronize();
      });

      expect(mockSystem.synchronize).toHaveBeenCalledWith(
        result.current.fieldState,
        result.current.consciousnessState
      );
    });

    it('should handle repeated activation calls', () => {
      const { result } = renderHook(() => useAutonomic(mockSystem));

      act(() => {
        result.current.activateAutonomic();
        result.current.activateAutonomic();
      });

      expect(result.current.isActive).toBe(true);
      expect(mockSystem.activate).toHaveBeenCalledTimes(2);
    });
  });

  describe('Stream Handling', () => {
    it('should handle flow updates from system', () => {
      const { result } = renderHook(() => useAutonomic(mockSystem));

      act(() => {
        mockFlowSubject.subscribe({
          field: { level: 95 },
          consciousness: { awarenessLevel: 85 }
        });
      });

      expect(result.current.fieldState.level).toBe(95);
      expect(result.current.consciousnessState.awarenessLevel).toBe(85);
    });

    it('should cleanup subscription on unmount', () => {
      const { unmount } = renderHook(() => useAutonomic(mockSystem));

      unmount();

      expect(mockFlowSubject.unsubscribe).toHaveBeenCalled();
    });

    it('should handle empty flow updates', () => {
      const { result } = renderHook(() => useAutonomic(mockSystem));

      act(() => {
        mockFlowSubject.subscribe({});
      });

      expect(result.current.fieldState).toEqual({
        id: 'default',
        type: 'energy',
        level: 70,
        isActive: true
      });
    });
  });

  describe('Validation', () => {
    it('should reject invalid field level values', () => {
      const { result } = renderHook(() => useAutonomic(mockSystem));
      const originalLevel = result.current.fieldState.level;

      act(() => {
        result.current.updateFieldState({ level: -1 });
      });
      expect(result.current.fieldState.level).toBe(originalLevel);

      act(() => {
        result.current.updateFieldState({ level: 101 });
      });
      expect(result.current.fieldState.level).toBe(originalLevel);
    });

    it('should reject invalid consciousness level values', () => {
      const { result } = renderHook(() => useAutonomic(mockSystem));
      const originalLevel = result.current.consciousnessState.awarenessLevel;

      act(() => {
        result.current.updateConsciousnessState({ awarenessLevel: -1 });
      });
      expect(result.current.consciousnessState.awarenessLevel).toBe(originalLevel);

      act(() => {
        result.current.updateConsciousnessState({ awarenessLevel: 101 });
      });
      expect(result.current.consciousnessState.awarenessLevel).toBe(originalLevel);
    });

    it('should validate field type', () => {
      const { result } = renderHook(() => useAutonomic(mockSystem));

      act(() => {
        // @ts-expect-error Testing invalid type
        result.current.updateFieldState({ type: 123 });
      });

      expect(result.current.fieldState.type).toBe('energy');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing system instance gracefully', () => {
      const { result } = renderHook(() => useAutonomic());

      expect(() => {
        act(() => {
          result.current.updateFieldState({ level: 85 });
          result.current.updateConsciousnessState({ awarenessLevel: 90 });
          result.current.activateAutonomic();
          result.current.synchronize();
        });
      }).not.toThrow();
    });

    it('should handle system method errors gracefully', () => {
      const errorSystem = {
        ...mockSystem,
        updateField: vi.fn().mockImplementation(() => {
          throw new Error('System error');
        })
      };

      const { result } = renderHook(() => useAutonomic(errorSystem));

      expect(() => {
        act(() => {
          result.current.updateFieldState({ level: 85 });
        });
      }).not.toThrow();

      // State should still update even if system method fails
      expect(result.current.fieldState.level).toBe(85);
    });
  });
}); 