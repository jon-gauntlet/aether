
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import _ Thr___ThreadView__;
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

// Mock child components
jest.mock('../MessageList', () => ({
  MessageList: ({ messages }: any) => (
    <div data-testid="message-list">
      {messages.map((m: any) => (
        <div key={m.id}>{m.content}</div>
      ))}
    </div>
  )
}));

jest.mock('../MessageInput', () => ({
  MessageInput: ({ onSendMessage }: any) => (
    <input
      data-testid="message-input"
      onChange={e => onSendMessage(e.target.value)}
    />
  )
}));

const mockMessages = [
  {
    id: '1',
    content: 'Test message 1',
    author: 'User 1',
    timestamp: Date.now()
  },
  {
    id: '2',
    content: 'Test message 2',
    author: 'User 2',
    timestamp: Date.now()
  }
];

describe('ThreadView', () => {
  const mockSend = jest.fn();
  const mockSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders message list and input', () => {
    render(
      <ThemeProvider theme={theme}>
        <ThreadView
          messages={mockMessages}
          onSendMessage={mockSend}
          onMessageSelect={mockSelect}
        />
      </ThemeProvider>
    );

    expect(screen.getByTestId('message-list')).toBeInTheDocument();
    expect(screen.getByTestId('message-input')).toBeInTheDocument();
  });

  it('shows protection state correctly', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <ThreadView
          messages={mockMessages}
          onSendMessage={mockSend}
          onMessageSelect={mockSelect}
        />
      </ThemeProvider>
    );

    const threadContainer = container.firstChild;
    expect(threadContainer).toHaveStyle(`border: 2px solid ${theme.colors.primary}`);
  });
}); 