import { renderHook, act } from '@testing-library/react';
import { useAutonomicDevelopment } from '../../../hooks/useAutonomicDevelopment';
import { vi } from 'vitest';

describe('useAutonomicDevelopment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useAutonomicDevelopment());

    expect(result.current.flowState).toEqual({
      depth: 0.5,
      resonance: 0.5,
      protection: {
        level: 0.5,
        type: 'soft'
      }
    });
    expect(result.current.currentMode).toBe('natural');
  });

  it('updates mode correctly', () => {
    const { result } = renderHook(() => useAutonomicDevelopment());

    act(() => {
      result.current.setMode('guided');
    });

    expect(result.current.currentMode).toBe('guided');
  });

  it('maintains flow state during mode changes', () => {
    const { result } = renderHook(() => useAutonomicDevelopment());
    const initialFlowState = result.current.flowState;

    act(() => {
      result.current.setMode('resonant');
    });

    expect(result.current.flowState).toEqual(initialFlowState);
  });
}); 