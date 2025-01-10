import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAutonomicSystem } from '../useAutonomicSystem';

describe('useAutonomicSystem', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useAutonomicSystem());
    expect(result.current.state).toBeDefined();
    expect(result.current.state.energy).toBeDefined();
    expect(result.current.state.flow).toBeDefined();
    expect(result.current.state.context).toBeDefined();
  });

  it('emits flow updates periodically', async () => {
    const { result } = renderHook(() => useAutonomicSystem());
    const initialFlow = result.current.state.flow;

    vi.advanceTimersByTime(1000);
    
    expect(result.current.state.flow).not.toBe(initialFlow);
  });

  it('maintains energy levels within valid range', () => {
    const { result } = renderHook(() => useAutonomicSystem());
    expect(result.current.state.energy.level).toBeGreaterThanOrEqual(0);
    expect(result.current.state.energy.level).toBeLessThanOrEqual(1);
  });

  it('maintains context depth within valid range', () => {
    const { result } = renderHook(() => useAutonomicSystem());
    expect(result.current.state.context.depth).toBeGreaterThanOrEqual(0);
    expect(result.current.state.context.depth).toBeLessThanOrEqual(1);
  });

  it('maintains protection depth within valid range', () => {
    const { result } = renderHook(() => useAutonomicSystem());
    expect(result.current.state.protection.level).toBeGreaterThanOrEqual(0);
    expect(result.current.state.protection.level).toBeLessThanOrEqual(1);
  });

  it('preserves energy type during state updates', () => {
    const { result } = renderHook(() => useAutonomicSystem());
    const initialType = result.current.state.energy.type;

    vi.advanceTimersByTime(1000);
    
    expect(result.current.state.energy.type).toBe(initialType);
  });

  it('preserves flow type during state updates', () => {
    const { result } = renderHook(() => useAutonomicSystem());
    const initialType = result.current.state.flow.type;

    vi.advanceTimersByTime(1000);
    
    expect(result.current.state.flow.type).toBe(initialType);
  });

  it('maintains pattern consistency during state updates', () => {
    const { result } = renderHook(() => useAutonomicSystem());
    const initialPattern = result.current.state.pattern;

    vi.advanceTimersByTime(1000);
    
    expect(result.current.state.pattern).toBeDefined();
    expect(result.current.state.pattern.id).toBe(initialPattern.id);
  });

  it('cleans up interval on unmount', () => {
    const { unmount } = renderHook(() => useAutonomicSystem());
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
}); 