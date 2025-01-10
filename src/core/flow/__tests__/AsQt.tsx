import React from 'react';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';
import { NaturalFlowType } from '../core/types/base';

describe('App', () => {
  it('renders the title', () => {
    const { getByText } = render(<App />);
    expect(getByText('Aether')).toBeInTheDocument();
  });

  it('renders FlowModeSelector with initial natural mode', () => {
    const { getByText } = render(<App />);
    const naturalButton = getByText('natural');
    expect(naturalButton).toHaveStyle({ background: 'rgba(255, 255, 255, 0.2)' });
  });

  it('renders FlowStateIndicator with initial metrics', () => {
    const { getByText } = render(<App />);
    expect(getByText('Flow: 0.80')).toBeInTheDocument();
  });

  it('updates mode when selecting different options', async () => {
    const { getByText } = render(<App />);
    const modes: NaturalFlowType[] = ['natural', 'guided', 'resonant'];

    for (const mode of modes) {
      await userEvent.click(getByText(mode));
      await waitFor(() => {
        const button = getByText(mode);
        expect(button).toHaveStyle({ background: 'rgba(255, 255, 255, 0.2)' });
      });
    }
  });

  it('maintains consistent layout structure', () => {
    const { container } = render(<App />);
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveStyle({
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1a1a1a',
      color: 'white',
    });
  });

  it('integrates FlowEngine with UI updates', async () => {
    const { getByText } = render(<App />);
    
    // Change to guided mode
    await userEvent.click(getByText('guided'));
    await waitFor(() => {
      expect(getByText('guided')).toHaveStyle({ background: 'rgba(255, 255, 255, 0.2)' });
    });

    // Verify flow indicator updates
    expect(getByText(/Flow: \d+\.\d+/)).toBeInTheDocument();
  });
}); 