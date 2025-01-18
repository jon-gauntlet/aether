import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactionDisplay } from '../components/ReactionDisplay';
import { TestWrapper } from './setup';

describe('ReactionDisplay', () => {
  const defaultProps = {
    messageId: '123',
    reactions: {
      '👍': 2,
      '❤️': 1,
      '😊': 0
    },
    userReactions: ['👍'],
    onReact: vi.fn()
  };

  it('renders reaction buttons with counts', () => {
    render(<ReactionDisplay {...defaultProps} />, { wrapper: TestWrapper });
    
    const thumbsUpButton = screen.getByTestId('reaction-👍');
    const heartButton = screen.getByTestId('reaction-❤️');
    const smileButton = screen.getByTestId('reaction-😊');
    
    expect(thumbsUpButton).toBeInTheDocument();
    expect(screen.getByTestId('reaction-count-👍')).toHaveTextContent('2');
    expect(heartButton).toBeInTheDocument();
    expect(screen.getByTestId('reaction-count-❤️')).toHaveTextContent('1');
    expect(smileButton).toBeInTheDocument();
  });

  it('applies active styling to user-reacted buttons', () => {
    render(<ReactionDisplay {...defaultProps} />, { wrapper: TestWrapper });
    
    const thumbsUpButton = screen.getByTestId('reaction-👍');
    const heartButton = screen.getByTestId('reaction-❤️');
    
    expect(thumbsUpButton).toHaveStyle({ backgroundColor: 'var(--chakra-colors-gray-200)' });
    expect(heartButton).not.toHaveStyle({ backgroundColor: 'var(--chakra-colors-gray-200)' });
  });

  it('shows reaction tooltips on hover', async () => {
    render(<ReactionDisplay {...defaultProps} />, { wrapper: TestWrapper });
    
    const thumbsUpButton = screen.getByTestId('reaction-👍');
    fireEvent.mouseEnter(thumbsUpButton);
    
    await waitFor(() => {
      expect(screen.getByText('2 people reacted')).toBeInTheDocument();
    });
  });

  it('handles loading state', () => {
    render(<ReactionDisplay {...defaultProps} isLoading={true} />, { wrapper: TestWrapper });
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('updates reaction count immediately on interaction', async () => {
    const onReact = vi.fn();
    const props = {
      ...defaultProps,
      onReact,
      userReactions: [],
      reactions: {
        '👍': 2,
        '❤️': 1,
        '😊': 0
      }
    };
    
    render(<ReactionDisplay {...props} />, { wrapper: TestWrapper });
    
    const thumbsUpButton = screen.getByTestId('reaction-👍');
    await userEvent.click(thumbsUpButton);
    
    expect(onReact).toHaveBeenCalledWith('123', '👍');
    expect(screen.getByTestId('reaction-count-👍')).toHaveTextContent('2');
  });

  it('handles removing reactions', async () => {
    const onReact = vi.fn();
    render(
      <ReactionDisplay 
        {...defaultProps}
        onReact={onReact}
      />,
      { wrapper: TestWrapper }
    );
    
    const thumbsUpButton = screen.getByTestId('reaction-👍');
    await userEvent.click(thumbsUpButton);
    
    expect(onReact).toHaveBeenCalledWith('123', '👍');
    expect(screen.getByTestId('reaction-count-👍')).toHaveTextContent('2');
  });
}); 