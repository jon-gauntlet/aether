
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
input } rom '../MessageInput';
import {  } from '../../../styles/theme';

// Mock useFlowState hook
jest.mock('../../../hooks/useFlowState', () => ({
  useFlowState: () => ({
    flowState: {
      energy: 0.8,
      type: 'FLOW'
    },
    isProtected: true
  })
}));

describe('MessageInput', () => {
  const mockSend = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders input and send button', () => {
    render(
      <ThemeProvider theme={theme}>
        <MessageInput onSendMessage={mockSend} />
      </ThemeProvider>
    );

    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    expect(screen.getByText('Send')).toBeInTheDocument();
  });

  it('handles message input and send', () => {
    render(
      <ThemeProvider theme={theme}>
        <MessageInput onSendMessage={mockSend} />
      </ThemeProvider>
    );

    const input = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(screen.getByText('Send'));

    expect(mockSend).toHaveBeenCalledWith('Test message');
  });

  it('handles Enter key press', () => {
    render(
      <ThemeProvider theme={theme}>
        <MessageInput onSendMessage={mockSend} />
      </ThemeProvider>
    );

    const input = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 13, charCode: 13 });

    expect(mockSend).toHaveBeenCalledWith('Test message');
  });

  it('shows protection state correctly', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <MessageInput onSendMessage={mockSend} />
      </ThemeProvider>
    );

    const inputContainer = container.firstChild;
    expect(inputContainer).toHaveStyle(`border: 1px solid ${theme.colors.primary}`);
  });
}); 