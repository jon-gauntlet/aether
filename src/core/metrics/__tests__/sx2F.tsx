import React from 'react';
import { render, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../App';
import { useFlow } from '../../core/hooks/useFlow';
import { renderHook } from '@testing-library/react-hooks';

describe('Flow System Integration', () => {
  it('synchronizes UI state with FlowEngine', async () => {
    const { getByText } = render(<App />);
    const { result } = renderHook(() => useFlow('main'));

    // Initial state check
    expect(getByText('natural')).toHaveStyle({ background: 'rgba(255, 255, 255, 0.2)' });
    expect(result.current.stream.type).toBe('natural');
    expect(getByText('Flow: 0.80')).toBeInTheDocument();

    // Change mode through UI
    await userEvent.click(getByText('guided'));
    expect(getByText('guided')).toHaveStyle({ background: 'rgba(255, 255, 255, 0.2)' });
    expect(result.current.stream.type).toBe('guided');

    // Change mode through engine
    act(() => {
      result.current.setMode('resonant');
    });
    expect(getByText('resonant')).toHaveStyle({ background: 'rgba(255, 255, 255, 0.2)' });
  });

  it('maintains consistent state across multiple instances', async () => {
    const { getByText } = render(<App />);
    const { result: hook1 } = renderHook(() => useFlow('main'));
    const { result: hook2 } = renderHook(() => useFlow('main'));

    // Change through UI affects both hooks
    await userEvent.click(getByText('guided'));
    expect(hook1.current.stream.type).toBe('guided');
    expect(hook2.current.stream.type).toBe('guided');

    // Change through hook affects UI
    act(() => {
      hook1.current.setMode('resonant');
    });
    expect(getByText('resonant')).toHaveStyle({ background: 'rgba(255, 255, 255, 0.2)' });
    expect(hook2.current.stream.type).toBe('resonant');
  });

  it('handles rapid mode changes correctly', async () => {
    const { getByText } = render(<App />);
    const modes = ['natural', 'guided', 'resonant'];

    // Rapid UI changes
    for (const mode of modes) {
      await userEvent.click(getByText(mode));
      expect(getByText(mode)).toHaveStyle({ background: 'rgba(255, 255, 255, 0.2)' });
    }

    // Verify final state
    expect(getByText('resonant')).toHaveStyle({ background: 'rgba(255, 255, 255, 0.2)' });
    expect(getByText(/Flow: \d+\.\d+/)).toBeInTheDocument();
  });

  it('preserves metrics during mode transitions', async () => {
    const { getByText } = render(<App />);
    const { result } = renderHook(() => useFlow('main'));

    const initialMetrics = { ...result.current.stream.metrics };

    // Change modes
    await userEvent.click(getByText('guided'));
    await userEvent.click(getByText('resonant'));
    await userEvent.click(getByText('natural'));

    // Verify metrics maintained core values
    expect(result.current.stream.metrics.depth).toBe(initialMetrics.depth);
    expect(result.current.stream.metrics.coherence).toBe(initialMetrics.coherence);
    expect(result.current.stream.metrics.harmony).toBe(initialMetrics.harmony);
  });
}); 