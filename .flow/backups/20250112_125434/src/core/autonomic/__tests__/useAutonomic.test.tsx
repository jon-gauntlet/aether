import { renderHook, act } from '@testing-library/react-hooks';
import { useAutonomic } from '../useAutonomic';
import { Field, FlowState } from '../../types/base';
import { ConsciousnessState } from '../../types/consciousness';
import { ActionType } from '../AutonomicValidation';

describe('useAutonomic', () => {
  let mockField: Field;
  let mockConsciousness: ConsciousnessState;

  beforeEach(() => {
    mockField = {
      id: '1',
      name: 'Test Field',
      strength: 0.8,
      resonance: {
        frequency: 1.0,
        amplitude: 0.7,
        phase: 0,
        harmonics: [1.0, 2.0]
      },
      protection: {
        shields: 0.9,
        recovery: 0.8,
        resilience: 0.7,
        adaptability: 0.6
      },
      flowMetrics: {
        velocity: 0.8,
        momentum: 0.7,
        resistance: 0.2,
        conductivity: 0.9
      },
      naturalFlow: {
        direction: 1,
        intensity: 0.8,
        stability: 0.7,
        sustainability: 0.9
      }
    };

    mockConsciousness = {
      currentState: FlowState.FLOW,
      fields: [mockField],
      flowSpace: {
        dimensions: 3,
        capacity: 100,
        utilization: 0.5,
        stability: 0.8,
        fields: [mockField],
        boundaries: []
      },
      lastTransition: Date.now(),
      stateHistory: [FlowState.FOCUS, FlowState.FLOW],
      metrics: {
        clarity: 0.8,
        depth: 0.7,
        coherence: 0.9,
        integration: 0.8,
        flexibility: 0.7
      }
    };
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAutonomic(mockField, mockConsciousness));

    expect(result.current.isActive).toBe(false);
    expect(result.current.activePatterns).toHaveLength(0);
    expect(result.current.metrics.autonomyScore).toBeGreaterThan(0);
  });

  it('should activate autonomic system', () => {
    const { result } = renderHook(() => useAutonomic(mockField, mockConsciousness));

    act(() => {
      result.current.activate();
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.metrics.autonomyScore).toBeGreaterThan(0.7);
  });

  it('should detect and activate patterns', () => {
    const { result } = renderHook(() => useAutonomic(mockField, mockConsciousness));

    act(() => {
      result.current.activate();
      result.current.detectPatterns();
    });

    expect(result.current.activePatterns.length).toBeGreaterThan(0);
    expect(result.current.metrics.patternStrength).toBeGreaterThan(0);
  });

  it('should validate actions before execution', () => {
    const { result } = renderHook(() => useAutonomic(mockField, mockConsciousness));

    act(() => {
      result.current.activate();
    });

    const validationResult = result.current.validateAction({
      type: ActionType.ENHANCE_FLOW,
      field: mockField,
      consciousness: mockConsciousness
    });

    expect(validationResult.isValid).toBe(true);
    expect(validationResult.confidence).toBeGreaterThan(0.7);
  });

  it('should track autonomic metrics', () => {
    const { result } = renderHook(() => useAutonomic(mockField, mockConsciousness));

    act(() => {
      result.current.activate();
      result.current.updateMetrics();
    });

    expect(result.current.metrics).toEqual(expect.objectContaining({
      autonomyScore: expect.any(Number),
      patternStrength: expect.any(Number),
      adaptability: expect.any(Number),
      stability: expect.any(Number)
    }));
  });

  it('should handle state transitions', () => {
    const { result } = renderHook(() => useAutonomic(mockField, mockConsciousness));

    act(() => {
      result.current.activate();
      result.current.transitionTo(FlowState.HYPERFOCUS);
    });

    expect(result.current.currentState).toBe(FlowState.HYPERFOCUS);
    expect(result.current.metrics.stability).toBeGreaterThan(0.5);
  });

  it('should adapt to field changes', () => {
    const { result, rerender } = renderHook(
      ({ field }) => useAutonomic(field, mockConsciousness),
      { initialProps: { field: mockField } }
    );

    const updatedField = {
      ...mockField,
      strength: 0.9,
      resonance: { ...mockField.resonance, amplitude: 0.8 }
    };

    act(() => {
      result.current.activate();
    });

    rerender({ field: updatedField });

    expect(result.current.metrics.adaptability).toBeGreaterThan(0.6);
  });

  it('should maintain pattern history', () => {
    const { result } = renderHook(() => useAutonomic(mockField, mockConsciousness));

    act(() => {
      result.current.activate();
      result.current.detectPatterns();
      result.current.recordPattern('test_pattern');
    });

    expect(result.current.patternHistory).toContain('test_pattern');
  });

  it('should handle recovery state', () => {
    const { result } = renderHook(() => useAutonomic(mockField, mockConsciousness));

    act(() => {
      result.current.activate();
      result.current.initiateRecovery();
    });

    expect(result.current.currentState).toBe(FlowState.RECOVERING);
    expect(result.current.metrics.stability).toBeGreaterThan(0.7);
  });
}); 