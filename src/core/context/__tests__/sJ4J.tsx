import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useContext } from '../useContext';

describe('useContext', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useContext());
    
    expect(result.current.id).toBe('aether-context');
    expect(result.current.type).toBe('system');
    expect(result.current.content).toBe('Welcome to Aether');
    expect(result.current.metadata).toEqual({});
  });

  it('updates content', () => {
    const { result } = renderHook(() => useContext());

    act(() => {
      result.current.updateContent('New content');
    });

    expect(result.current.content).toBe('New content');
  });

  it('updates type', () => {
    const { result } = renderHook(() => useContext());

    act(() => {
      result.current.updateType('user');
    });

    expect(result.current.type).toBe('user');
  });

  it('updates metadata', () => {
    const { result } = renderHook(() => useContext());

    act(() => {
      result.current.updateMetadata({ key: 'value' });
    });

    expect(result.current.metadata).toEqual({ key: 'value' });
  });

  it('merges metadata', () => {
    const { result } = renderHook(() => useContext());

    act(() => {
      result.current.updateMetadata({ a: '1' });
      result.current.updateMetadata({ b: '2' });
    });

    expect(result.current.metadata).toEqual({
      a: '1',
      b: '2'
    });
  });

  it('clears metadata', () => {
    const { result } = renderHook(() => useContext());

    act(() => {
      result.current.updateMetadata({ key: 'value' });
      result.current.clearMetadata();
    });

    expect(result.current.metadata).toEqual({});
  });

  it('updates lastModified on touch', () => {
    const { result } = renderHook(() => useContext());
    const before = result.current.lastModified;

    act(() => {
      result.current.touch();
    });

    expect(result.current.lastModified).toBeGreaterThan(before);
  });

  it('shares state across multiple hooks', () => {
    const { result: result1 } = renderHook(() => useContext());
    const { result: result2 } = renderHook(() => useContext());

    act(() => {
      result1.current.updateContent('New content');
    });

    expect(result2.current.content).toBe('New content');
  });

  it('maintains subscription during component lifecycle', () => {
    const { result, rerender } = renderHook(() => useContext());

    act(() => {
      result.current.updateContent('New content');
    });

    rerender();

    expect(result.current.content).toBe('New content');
  });

  it('handles rapid state changes', () => {
    const { result } = renderHook(() => useContext());

    act(() => {
      result.current.updateContent('Content 1');
      result.current.updateContent('Content 2');
      result.current.updateContent('Content 3');
    });

    expect(result.current.content).toBe('Content 3');
  });

  it('preserves metadata during content/type updates', () => {
    const { result } = renderHook(() => useContext());

    act(() => {
      result.current.updateMetadata({ key: 'value' });
      result.current.updateContent('New content');
      result.current.updateType('user');
    });

    expect(result.current.metadata).toEqual({ key: 'value' });
  });

  it('updates lastModified on all state changes', () => {
    const { result } = renderHook(() => useContext());
    let lastTime = result.current.lastModified;

    act(() => {
      result.current.updateContent('New content');
    });
    expect(result.current.lastModified).toBeGreaterThan(lastTime);
    lastTime = result.current.lastModified;

    act(() => {
      result.current.updateType('user');
    });
    expect(result.current.lastModified).toBeGreaterThan(lastTime);
    lastTime = result.current.lastModified;

    act(() => {
      result.current.updateMetadata({ key: 'value' });
    });
    expect(result.current.lastModified).toBeGreaterThan(lastTime);
  });

  it('handles all valid context types', () => {
    const { result } = renderHook(() => useContext());
    const types: Array<'system' | 'user' | 'hidden'> = ['system', 'user', 'hidden'];

    types.forEach(type => {
      act(() => {
        result.current.updateType(type);
      });
      expect(result.current.type).toBe(type);
    });
  });
}); 