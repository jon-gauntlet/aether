import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ChatContainer } from '../components/ChatContainer'
import { TestWrapper } from './setup'

// Mock data and functions
const mockMessages = [
  { id: 1, content: 'Test message 1', sender: 'user' },
  { id: 2, content: 'Test message 2', sender: 'assistant' }
];

const mockMutate = vi.fn();
const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();
const mockSendMessage = vi.fn().mockResolvedValue({ id: 3, content: 'New message', channel: 'general' });

// Mock API client
vi.mock('../api/client', () => ({
  default: {
    useQuery: () => ({
      data: mockMessages,
      isLoading: false,
      error: null
    }),
    useMutation: () => ({
      mutate: mockMutate,
      isLoading: false,
      error: null
    }),
    sendMessage: mockSendMessage,
    subscribeToMessages: () => ({
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe
    })
  }
}));

describe('ChatContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chat container with messages', async () => {
    render(<ChatContainer />, { wrapper: TestWrapper });
    
    await waitFor(() => {
      expect(screen.getByText('Test message 1')).toBeInTheDocument();
      expect(screen.getByText('Test message 2')).toBeInTheDocument();
    });
  });

  it('handles message sending', async () => {
    const user = userEvent.setup();
    render(<ChatContainer />, { wrapper: TestWrapper });
    
    const input = screen.getByTestId('message-input');
    const sendButton = screen.getByTestId('send-button');

    await user.type(input, 'New message');
    await user.click(sendButton);

    expect(mockMutate).toHaveBeenCalled();
  });

  it('subscribes to channel updates', async () => {
    render(<ChatContainer />, { wrapper: TestWrapper });
    
    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalled();
    });
  });

  it('handles message loading errors', async () => {
    vi.mock('../api/client', () => ({
      useQuery: () => ({
        data: null,
        isLoading: false,
        error: new Error('Failed to load')
      }),
      useMutation: () => ({
        mutate: mockMutate,
        isLoading: false,
        error: null
      }),
      sendMessage: mockSendMessage,
      subscribeToMessages: () => ({
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe
      })
    }));
    
    render(<ChatContainer />, { wrapper: TestWrapper });
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load chat history')).toBeInTheDocument();
    });
  });

  it('handles message sending errors', async () => {
    const user = userEvent.setup();
    mockMutate.mockRejectedValueOnce(new Error('Failed to send'));
    
    render(<ChatContainer />, { wrapper: TestWrapper });
    
    const input = screen.getByTestId('message-input');
    const sendButton = screen.getByTestId('send-button');

    await user.type(input, 'Test message');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to send message')).toBeInTheDocument();
    });
  });

  it('updates messages when receiving real-time updates', async () => {
    let subscriptionCallback;
    mockSubscribe.mockImplementation((callback) => {
      subscriptionCallback = callback;
    });

    render(<ChatContainer />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('Test message 1')).toBeInTheDocument();
    });

    // Simulate receiving a new message
    const newMessage = { id: 4, content: 'Real-time message', channel: 'general' };
    subscriptionCallback(newMessage);

    await waitFor(() => {
      expect(screen.getByText('Real-time message')).toBeInTheDocument();
    });
  });

  it('cleans up subscription on unmount', async () => {
    const { unmount } = render(<ChatContainer />, { wrapper: TestWrapper });
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
}); 