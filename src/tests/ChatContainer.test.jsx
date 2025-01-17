import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useToast } from '@chakra-ui/react';
import { ChatContainer } from '../components/ChatContainer';
import { apiClient } from '../services/apiClient';
import { TestWrapper } from './setup';

// Mock the useToast hook
vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: vi.fn()
  };
});

// Mock the API client
vi.mock('../services/apiClient', () => ({
  apiClient: {
    getChatHistory: vi.fn(),
    processQuery: vi.fn(),
    uploadFile: vi.fn(),
    checkHealth: vi.fn()
  }
}));

describe('ChatContainer', () => {
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useToast.mockReturnValue(mockToast);
    apiClient.getChatHistory.mockResolvedValue([{ id: 1, content: 'Hello', role: 'user' }]);
    apiClient.processQuery.mockResolvedValue({ content: 'Hello back!' });
    apiClient.uploadFile.mockResolvedValue({ message: 'Document uploaded successfully' });
    apiClient.checkHealth.mockResolvedValue({ status: 'ok' });
  });

  it('renders child components', async () => {
    render(<ChatContainer />, { wrapper: TestWrapper });
    
    await waitFor(() => {
      expect(screen.getByTestId('chat-message-list')).toBeInTheDocument();
      expect(screen.getByTestId('chat-input')).toBeInTheDocument();
      expect(screen.getByTestId('upload-area')).toBeInTheDocument();
    });
  });

  it('loads chat history', async () => {
    render(<ChatContainer />, { wrapper: TestWrapper });
    
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });

  it('handles message sending', async () => {
    render(<ChatContainer />, { wrapper: TestWrapper });
    
    const input = screen.getByTestId('chat-input');
    await userEvent.type(input, 'Hello');
    await userEvent.click(screen.getByTestId('send-button'));
    
    await waitFor(() => {
      expect(apiClient.processQuery).toHaveBeenCalledWith('Hello');
      expect(screen.getByText('Hello back!')).toBeInTheDocument();
    });
  });

  it('handles file uploads', async () => {
    render(<ChatContainer />, { wrapper: TestWrapper });
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByTestId('file-input');
    await userEvent.upload(input, file);
    
    await waitFor(() => {
      expect(apiClient.uploadFile).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Success',
        description: 'Document uploaded successfully',
        status: 'success'
      }));
    });
  });

  it('shows error toast when API is unhealthy', async () => {
    apiClient.checkHealth.mockRejectedValue(new Error('API error'));
    render(<ChatContainer />, { wrapper: TestWrapper });
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error',
        description: 'API is not available',
        status: 'error'
      }));
    });
  });

  it('handles message sending errors', async () => {
    apiClient.processQuery.mockRejectedValue(new Error('API error'));
    render(<ChatContainer />, { wrapper: TestWrapper });
    
    const input = screen.getByTestId('chat-input');
    await userEvent.type(input, 'Hello');
    await userEvent.click(screen.getByTestId('send-button'));
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error',
        description: 'Failed to send message',
        status: 'error'
      }));
    });
  });

  it('updates UI state during API calls', async () => {
    apiClient.processQuery.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<ChatContainer />, { wrapper: TestWrapper });
    
    const input = screen.getByTestId('chat-input');
    await userEvent.type(input, 'Hello');
    await userEvent.click(screen.getByTestId('send-button'));
    
    expect(input).toHaveAttribute('disabled');
    expect(screen.getByTestId('send-button')).toBeDisabled();
    
    await waitFor(() => {
      expect(input).not.toHaveAttribute('disabled');
      expect(screen.getByTestId('send-button')).not.toBeDisabled();
    });
  });
}); 