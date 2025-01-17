import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from '../components/ChatInput';
import { TestWrapper } from './setup';

describe('ChatInput', () => {
  const defaultProps = {
    onSendMessage: vi.fn(),
    isLoading: false
  };

  it('renders input field and send button', () => {
    render(<ChatInput {...defaultProps} />, { wrapper: TestWrapper });
    
    expect(screen.getByTestId('chat-input')).toBeInTheDocument();
    expect(screen.getByTestId('send-button')).toBeInTheDocument();
  });

  it('handles message input and submission', async () => {
    render(<ChatInput {...defaultProps} />, { wrapper: TestWrapper });
    
    const input = screen.getByTestId('chat-input');
    await userEvent.type(input, 'Hello');
    await userEvent.click(screen.getByTestId('send-button'));
    
    expect(defaultProps.onSendMessage).toHaveBeenCalledWith('Hello');
    expect(input.value).toBe('');
  });

  it('disables send button when input is empty', () => {
    render(<ChatInput {...defaultProps} />, { wrapper: TestWrapper });
    
    expect(screen.getByTestId('send-button')).toBeDisabled();
  });

  it('handles Enter key press for submission', async () => {
    render(<ChatInput {...defaultProps} />, { wrapper: TestWrapper });
    
    const input = screen.getByTestId('chat-input');
    await userEvent.type(input, 'Hello{Enter}');
    
    expect(defaultProps.onSendMessage).toHaveBeenCalledWith('Hello');
    expect(input.value).toBe('');
  });

  it('handles Shift+Enter for new line', async () => {
    render(<ChatInput {...defaultProps} />, { wrapper: TestWrapper });
    
    const input = screen.getByTestId('chat-input');
    await userEvent.type(input, 'Hello{Shift>}{Enter}{/Shift}');
    
    expect(defaultProps.onSendMessage).not.toHaveBeenCalled();
  });

  it('trims whitespace before sending', async () => {
    render(<ChatInput {...defaultProps} />, { wrapper: TestWrapper });
    
    const input = screen.getByTestId('chat-input');
    await userEvent.type(input, '  Hello  ');
    await userEvent.click(screen.getByTestId('send-button'));
    
    expect(defaultProps.onSendMessage).toHaveBeenCalledWith('Hello');
  });

  it('disables input and button while loading', () => {
    render(<ChatInput {...defaultProps} isLoading={true} />, { wrapper: TestWrapper });
    
    expect(screen.getByTestId('chat-input')).toBeDisabled();
    expect(screen.getByTestId('send-button')).toBeDisabled();
  });

  it('shows character count when near limit', async () => {
    render(<ChatInput {...defaultProps} />, { wrapper: TestWrapper });
    
    const input = screen.getByTestId('chat-input');
    const longText = 'a'.repeat(960); // Near the 1000 character limit
    await userEvent.type(input, longText);
    
    expect(screen.getByTestId('char-count')).toHaveTextContent(`${longText.length}/1000`);
  });
}); 