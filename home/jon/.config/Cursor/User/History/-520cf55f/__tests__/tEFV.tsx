import { renderHook, act } from '@testing-library/react';
import { useAutonomicDevelopment } from '../useAutonomicDevelopment';
import { vi } from 'vitest';

describe('useAutonomicDevelopment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useAutonomicDevelopment());

    expect(result.current.flowState.depth).toBe(0.5);
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
    const initialDepth = result.current.flowState.depth;

    act(() => {
      result.current.setMode('resonant');
    });

    expect(result.current.flowState.depth).toBe(initialDepth);
  });
}); 