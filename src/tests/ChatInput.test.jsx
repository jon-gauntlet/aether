import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from '../components/ChatInput';
import { TestWrapper } from './setup';

describe('ChatInput', () => {
  const defaultProps = {
    onSendMessage: vi.fn(),
    isLoading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input and send button', () => {
    render(<ChatInput {...defaultProps} />, { wrapper: TestWrapper });
    expect(screen.getByTestId('chat-input')).toBeInTheDocument();
    expect(screen.getByTestId('send-button')).toBeInTheDocument();
  });

  it('trims whitespace before sending message', async () => {
    render(<ChatInput {...defaultProps} />, { wrapper: TestWrapper });
    const input = screen.getByTestId('chat-input');
    
    await userEvent.type(input, '   Hello   ');
    await userEvent.click(screen.getByTestId('send-button'));
    
    expect(defaultProps.onSendMessage).toHaveBeenCalledWith('Hello');
  });

  it('shows character count when near limit', async () => {
    render(<ChatInput {...defaultProps} />, { wrapper: TestWrapper });
    const input = screen.getByTestId('chat-input');
    
    const longString = 'a'.repeat(950);
    await userEvent.type(input, longString);
    
    expect(screen.getByText(`${longString.length}/1000`)).toBeInTheDocument();
  });

  it('handles Shift+Enter for new line', async () => {
    render(<ChatInput {...defaultProps} />, { wrapper: TestWrapper });
    const input = screen.getByTestId('chat-input');
    
    await userEvent.type(input, 'Hello{Shift>}{Enter}{/Shift}');
    
    expect(defaultProps.onSendMessage).not.toHaveBeenCalled();
    expect(input.value).toContain('Hello\n');
  });

  it('disables input and button while loading', () => {
    render(<ChatInput {...defaultProps} isLoading={true} />, { wrapper: TestWrapper });
    
    expect(screen.getByTestId('chat-input')).toBeDisabled();
    expect(screen.getByTestId('send-button')).toBeDisabled();
  });

  it('disables send button when input is empty', async () => {
    render(<ChatInput {...defaultProps} />, { wrapper: TestWrapper });
    const button = screen.getByTestId('send-button');
    
    expect(button).toBeDisabled();
    
    await userEvent.type(screen.getByTestId('chat-input'), 'Hello');
    expect(button).not.toBeDisabled();
    
    await userEvent.clear(screen.getByTestId('chat-input'));
    expect(button).toBeDisabled();
  });
}); 