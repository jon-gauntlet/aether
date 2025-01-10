import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useNavigation } from '../useNavigation';

describe('useNavigation', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useNavigation());
    
    expect(result.current.currentPath).toBe('/');
    expect(result.current.params).toEqual({});
    expect(result.current.previousPath).toBeUndefined();
  });

  it('updates state on navigation', () => {
    const { result } = renderHook(() => useNavigation());

    act(() => {
      result.current.navigate('/test', { id: '123' });
    });

    expect(result.current.currentPath).toBe('/test');
    expect(result.current.params).toEqual({ id: '123' });
  });

  it('maintains navigation history', () => {
    const { result } = renderHook(() => useNavigation());

    act(() => {
      result.current.navigate('/first');
      result.current.navigate('/second');
    });

    expect(result.current.currentPath).toBe('/second');
    expect(result.current.previousPath).toBe('/first');
  });

  it('handles back navigation', () => {
    const { result } = renderHook(() => useNavigation());

    act(() => {
      result.current.navigate('/first');
      result.current.navigate('/second');
      result.current.goBack();
    });

    expect(result.current.currentPath).toBe('/first');
  });

  it('manages params independently', () => {
    const { result } = renderHook(() => useNavigation());

    act(() => {
      result.current.navigate('/test', { id: '123' });
      result.current.updateParams({ name: 'test' });
    });

    expect(result.current.params).toEqual({
      id: '123',
      name: 'test'
    });
  });

  it('clears params', () => {
    const { result } = renderHook(() => useNavigation());

    act(() => {
      result.current.navigate('/test', { id: '123' });
      result.current.clearParams();
    });

    expect(result.current.params).toEqual({});
  });

  it('shares state across multiple hooks', () => {
    const { result: result1 } = renderHook(() => useNavigation());
    const { result: result2 } = renderHook(() => useNavigation());

    act(() => {
      result1.current.navigate('/test');
    });

    expect(result2.current.currentPath).toBe('/test');
  });

  it('maintains subscription during component lifecycle', () => {
    const { result, rerender } = renderHook(() => useNavigation());

    act(() => {
      result.current.navigate('/test');
    });

    rerender();

    expect(result.current.currentPath).toBe('/test');
  });

  it('handles rapid navigation changes', () => {
    const { result } = renderHook(() => useNavigation());

    act(() => {
      result.current.navigate('/first');
      result.current.navigate('/second');
      result.current.navigate('/third');
    });

    expect(result.current.currentPath).toBe('/third');
    expect(result.current.previousPath).toBe('/second');
  });

  it('preserves params during navigation chain', () => {
    const { result } = renderHook(() => useNavigation());

    act(() => {
      result.current.navigate('/first', { id: '123' });
      result.current.updateParams({ name: 'test' });
      result.current.navigate('/second');
    });

    expect(result.current.params).toEqual({
      id: '123',
      name: 'test'
    });
  });
}); 