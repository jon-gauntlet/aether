import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useWorkspace } from '../useWorkspace';

describe('useWorkspace', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useWorkspace());
    
    expect(result.current.id).toBe('aether');
    expect(result.current.name).toBe('Aether');
    expect(result.current.path).toBe('/home/jon/projects/aether');
    expect(result.current.settings).toEqual({});
  });

  it('updates name', () => {
    const { result } = renderHook(() => useWorkspace());

    act(() => {
      result.current.updateName('New Name');
    });

    expect(result.current.name).toBe('New Name');
  });

  it('updates path', () => {
    const { result } = renderHook(() => useWorkspace());

    act(() => {
      result.current.updatePath('/new/path');
    });

    expect(result.current.path).toBe('/new/path');
  });

  it('updates settings', () => {
    const { result } = renderHook(() => useWorkspace());

    act(() => {
      result.current.updateSettings({ theme: 'dark' });
    });

    expect(result.current.settings).toEqual({ theme: 'dark' });
  });

  it('merges settings', () => {
    const { result } = renderHook(() => useWorkspace());

    act(() => {
      result.current.updateSettings({ theme: 'dark' });
      result.current.updateSettings({ fontSize: 14 });
    });

    expect(result.current.settings).toEqual({
      theme: 'dark',
      fontSize: 14
    });
  });

  it('clears settings', () => {
    const { result } = renderHook(() => useWorkspace());

    act(() => {
      result.current.updateSettings({ theme: 'dark' });
      result.current.clearSettings();
    });

    expect(result.current.settings).toEqual({});
  });

  it('updates lastAccessed on touch', () => {
    const { result } = renderHook(() => useWorkspace());
    const before = result.current.lastAccessed;

    act(() => {
      result.current.touch();
    });

    expect(result.current.lastAccessed).toBeGreaterThan(before);
  });

  it('shares state across multiple hooks', () => {
    const { result: result1 } = renderHook(() => useWorkspace());
    const { result: result2 } = renderHook(() => useWorkspace());

    act(() => {
      result1.current.updateName('New Name');
    });

    expect(result2.current.name).toBe('New Name');
  });

  it('maintains subscription during component lifecycle', () => {
    const { result, rerender } = renderHook(() => useWorkspace());

    act(() => {
      result.current.updateName('New Name');
    });

    rerender();

    expect(result.current.name).toBe('New Name');
  });

  it('handles rapid state changes', () => {
    const { result } = renderHook(() => useWorkspace());

    act(() => {
      result.current.updateName('Name 1');
      result.current.updateName('Name 2');
      result.current.updateName('Name 3');
    });

    expect(result.current.name).toBe('Name 3');
  });

  it('preserves settings during name/path updates', () => {
    const { result } = renderHook(() => useWorkspace());

    act(() => {
      result.current.updateSettings({ theme: 'dark' });
      result.current.updateName('New Name');
      result.current.updatePath('/new/path');
    });

    expect(result.current.settings).toEqual({ theme: 'dark' });
  });

  it('updates lastAccessed on all state changes', () => {
    const { result } = renderHook(() => useWorkspace());
    let lastTime = result.current.lastAccessed;

    act(() => {
      result.current.updateName('New Name');
    });
    expect(result.current.lastAccessed).toBeGreaterThan(lastTime);
    lastTime = result.current.lastAccessed;

    act(() => {
      result.current.updatePath('/new/path');
    });
    expect(result.current.lastAccessed).toBeGreaterThan(lastTime);
    lastTime = result.current.lastAccessed;

    act(() => {
      result.current.updateSettings({ theme: 'dark' });
    });
    expect(result.current.lastAccessed).toBeGreaterThan(lastTime);
  });
}); 