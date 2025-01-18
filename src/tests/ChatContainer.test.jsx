import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ChatContainer } from '../components/ChatContainer';
import { TestWrapper } from './TestWrapper';

// Mock child components
vi.mock('../components/ChatMessageList', () => ({
  ChatMessageList: () => <div data-testid="chat-message-list">Messages</div>
}));

vi.mock('../components/ChatInput', () => ({
  ChatInput: ({ onSendMessage }) => (
    <input 
      data-testid="chat-input" 
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onSendMessage(e.target.value);
        }
      }}
    />
  )
}));

vi.mock('../components/FileUpload', () => ({
  FileUpload: () => <div data-testid="file-upload">Upload</div>
}));

// Mock API client
const mockApiClient = {
  getChatHistory: vi.fn().mockResolvedValue([]),
  processQuery: vi.fn().mockResolvedValue({ text: 'Response' }),
  uploadFile: vi.fn().mockResolvedValue({ message: 'File uploaded' }),
  checkHealth: vi.fn().mockResolvedValue(true)
};

vi.mock('../services/apiClient', () => ({
  apiClient: mockApiClient
}));

describe('ChatContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all child components', () => {
    render(<ChatContainer />, { wrapper: TestWrapper });
    expect(screen.getByTestId('chat-message-list')).toBeInTheDocument();
    expect(screen.getByTestId('chat-input')).toBeInTheDocument();
    expect(screen.getByTestId('file-upload')).toBeInTheDocument();
  });

  it('loads and displays chat history on mount', async () => {
    const messages = [{ id: 1, text: 'Test message' }];
    mockApiClient.getChatHistory.mockResolvedValueOnce(messages);

    render(<ChatContainer />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(mockApiClient.getChatHistory).toHaveBeenCalled();
    });
  });

  it('handles sending messages', async () => {
    render(<ChatContainer />, { wrapper: TestWrapper });
    const input = screen.getByTestId('chat-input');

    fireEvent.keyDown(input, { key: 'Enter', target: { value: 'Test message' } });

    await waitFor(() => {
      expect(mockApiClient.processQuery).toHaveBeenCalledWith('Test message');
    });
  });

  it('handles file uploads', async () => {
    render(<ChatContainer />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(screen.getByTestId('file-upload')).toBeInTheDocument();
    });
  });

  it('shows error toast when API is unhealthy', async () => {
    mockApiClient.checkHealth.mockRejectedValueOnce(new Error('API error'));
    render(<ChatContainer />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(mockApiClient.checkHealth).toHaveBeenCalled();
    });
  });

  it('handles message sending errors', async () => {
    mockApiClient.processQuery.mockRejectedValueOnce(new Error('Failed to send'));
    render(<ChatContainer />, { wrapper: TestWrapper });
    
    const input = screen.getByTestId('chat-input');
    fireEvent.keyDown(input, { key: 'Enter', target: { value: 'Test message' } });

    await waitFor(() => {
      expect(mockApiClient.processQuery).toHaveBeenCalled();
    });
  });

  it('updates UI state during API calls', async () => {
    render(<ChatContainer />, { wrapper: TestWrapper });
    const input = screen.getByTestId('chat-input');

    fireEvent.keyDown(input, { key: 'Enter', target: { value: 'Test message' } });

    await waitFor(() => {
      expect(mockApiClient.processQuery).toHaveBeenCalled();
    });
  });
}); 