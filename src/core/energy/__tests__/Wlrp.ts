import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutonomicDevelopment } from '../useAutonomicDevelopment';
import { BehaviorSubject } from 'rxjs';

describe('useAutonomicDevelopment', () => {
  const flow$ = new BehaviorSubject({
    type: 'natural',
    level: 0.5,
    metrics: {
      focus: 0.5,
      presence: 0.5,
      coherence: 0.5
    }
  });

  const energy$ = new BehaviorSubject({
    type: 'steady',
    level: 0.5,
    flow: 'natural'
  });

  const context$ = new BehaviorSubject({
    depth: 0.5,
    type: 'development',
    presence: 'neutral'
  });

  const props = {
    flow$,
    energy$,
    context$
  };

  it('initializes with default state', () => {
    const { result } = renderHook(() => useAutonomicDevelopment(props));
    expect(result.current.state).toBeDefined();
    expect(result.current.state.energy).toBeDefined();
    expect(result.current.state.flow).toBeDefined();
    expect(result.current.state.context).toBeDefined();
  });

  it('updates state based on flow changes', () => {
    const { result } = renderHook(() => useAutonomicDevelopment(props));
    const initialState = result.current.state;

    act(() => {
      flow$.next({
        type: 'guided',
        level: 0.7,
        metrics: {
          focus: 0.7,
          presence: 0.7,
          coherence: 0.7
        }
      });
    });

    expect(result.current.state).not.toBe(initialState);
    expect(result.current.state.flow.type).toBe('guided');
  });

  it('maintains energy levels within valid range', () => {
    const { result } = renderHook(() => useAutonomicDevelopment(props));
    expect(result.current.state.energy.level).toBeGreaterThanOrEqual(0);
    expect(result.current.state.energy.level).toBeLessThanOrEqual(1);
  });

  it('maintains context depth within valid range', () => {
    const { result } = renderHook(() => useAutonomicDevelopment(props));
    expect(result.current.state.context.depth).toBeGreaterThanOrEqual(0);
    expect(result.current.state.context.depth).toBeLessThanOrEqual(1);
  });

  it('maintains protection depth within valid range', () => {
    const { result } = renderHook(() => useAutonomicDevelopment(props));
    expect(result.current.state.protection.level).toBeGreaterThanOrEqual(0);
    expect(result.current.state.protection.level).toBeLessThanOrEqual(1);
  });

  it('preserves context during protected states', () => {
    const { result } = renderHook(() => useAutonomicDevelopment(props));
    const initialContext = result.current.state.context;

    act(() => {
      flow$.next({
        type: 'protected',
        level: 0.8,
        metrics: {
          focus: 0.8,
          presence: 0.8,
          coherence: 0.8
        }
      });
    });

    expect(result.current.state.context).toBe(initialContext);
  });

  it('cleans up subscriptions on unmount', () => {
    const { unmount } = renderHook(() => useAutonomicDevelopment(props));
    const flowSpy = vi.spyOn(flow$, 'subscribe');
    const energySpy = vi.spyOn(energy$, 'subscribe');
    const contextSpy = vi.spyOn(context$, 'subscribe');

    act(() => {
      unmount();
    });

    expect(flowSpy).toHaveBeenCalled();
    expect(energySpy).toHaveBeenCalled();
    expect(contextSpy).toHaveBeenCalled();
  });
}); 