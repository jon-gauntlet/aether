import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatContainer } from '../components/ChatContainer';
import { TestWrapper } from './setup';
import { apiClient } from '../api/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the API client
vi.mock('../api/client', () => ({
  apiClient: {
    processQuery: vi.fn(),
    uploadFile: vi.fn(),
    getChatHistory: vi.fn(),
    checkHealth: vi.fn()
  }
}));

describe('ChatContainer', () => {
  let queryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
          staleTime: 0,
          refetchOnWindowFocus: false,
        },
      },
    });
    
    // Setup default mock implementations
    apiClient.getChatHistory.mockResolvedValue([
      { id: 1, content: 'Hello', role: 'user' }
    ]);
    apiClient.checkHealth.mockResolvedValue({ status: 'healthy' });
  });

  const renderWithClient = (ui) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>,
      { wrapper: TestWrapper }
    );
  };

  it('renders all child components', async () => {
    renderWithClient(<ChatContainer />);
    
    await waitFor(() => {
      expect(screen.getByTestId('chat-message-list')).toBeInTheDocument();
      expect(screen.getByTestId('chat-input')).toBeInTheDocument();
      expect(screen.getByTestId('file-upload')).toBeInTheDocument();
    });
  });

  it('loads and displays chat history on mount', async () => {
    renderWithClient(<ChatContainer />);
    
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
    expect(apiClient.getChatHistory).toHaveBeenCalledWith('default');
  });

  it('handles sending messages', async () => {
    const mockResponse = { content: 'Hello back!', role: 'assistant' };
    apiClient.processQuery.mockResolvedValue(mockResponse);
    
    renderWithClient(<ChatContainer />);
    
    const input = screen.getByTestId('chat-input');
    await userEvent.type(input, 'Hello');
    await userEvent.click(screen.getByTestId('send-button'));
    
    await waitFor(() => {
      expect(apiClient.processQuery).toHaveBeenCalledWith('Hello');
      expect(screen.getByText('Hello back!')).toBeInTheDocument();
    });
  });

  it('handles file uploads', async () => {
    const mockResponse = { message: 'Document uploaded successfully' };
    apiClient.uploadFile.mockResolvedValue(mockResponse);
    
    renderWithClient(<ChatContainer />);
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByTestId('file-input');
    
    await userEvent.upload(input, file);
    
    await waitFor(() => {
      expect(apiClient.uploadFile).toHaveBeenCalled();
      expect(screen.getByText(/document uploaded successfully/i)).toBeInTheDocument();
    });
  });

  it('shows error toast when API is unhealthy', async () => {
    apiClient.checkHealth.mockRejectedValue(new Error('API is down'));
    
    renderWithClient(<ChatContainer />);
    
    await waitFor(() => {
      expect(screen.getByText(/api is not available/i)).toBeInTheDocument();
    });
  });

  it('handles message sending errors', async () => {
    apiClient.processQuery.mockRejectedValue(new Error('Failed to send message'));
    
    renderWithClient(<ChatContainer />);
    
    const input = screen.getByTestId('chat-input');
    await userEvent.type(input, 'Hello');
    await userEvent.click(screen.getByTestId('send-button'));
    
    await waitFor(() => {
      expect(screen.getByText(/failed to send message/i)).toBeInTheDocument();
    });
  });

  it('updates UI state during API calls', async () => {
    apiClient.processQuery.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    renderWithClient(<ChatContainer />);
    
    const input = screen.getByTestId('chat-input');
    await userEvent.type(input, 'Hello');
    await userEvent.click(screen.getByTestId('send-button'));
    
    expect(input).toBeDisabled();
    expect(screen.getByTestId('send-button')).toBeDisabled();
    
    await waitFor(() => {
      expect(input).not.toBeDisabled();
      expect(screen.getByTestId('send-button')).not.toBeDisabled();
    });
  });
}); 