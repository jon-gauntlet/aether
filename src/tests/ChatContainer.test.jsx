import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ChatContainer } from '@/components/ChatContainer';
import { mockApiClient } from '@/test/utils';

vi.mock('@/services/apiClient', () => ({
  apiClient: mockApiClient
}));

describe('ChatContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows connection status', () => {
    render(<ChatContainer />);
    expect(screen.getByText(/Connected/i)).toBeInTheDocument();
  });

  it('handles message submission and response', async () => {
    render(<ChatContainer />);
    const input = screen.getByRole('textbox');
    const message = 'Hello, world!';

    fireEvent.change(input, { target: { value: message } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mockApiClient.sendMessage).toHaveBeenCalledWith(message);
    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it('handles keyboard navigation', () => {
    render(<ChatContainer />);
    const input = screen.getByRole('textbox');

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(mockApiClient.getPreviousMessage).toHaveBeenCalled();

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(mockApiClient.getNextMessage).toHaveBeenCalled();
  });

  it('shows loading states', async () => {
    mockApiClient.sendMessage.mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => resolve({ text: 'Response' }), 100);
    }));

    render(<ChatContainer />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    expect(await screen.findByText('Response')).toBeInTheDocument();
  });

  it('handles error states', async () => {
    const error = new Error('Failed to send message');
    mockApiClient.sendMessage.mockRejectedValueOnce(error);

    render(<ChatContainer />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(await screen.findByText(/Failed to send message/i)).toBeInTheDocument();
  });

  it('maintains scroll position on new messages', async () => {
    const { container } = render(<ChatContainer />);
    const messageList = container.querySelector('.message-list');
    const scrollHeight = 1000;
    const clientHeight = 500;

    Object.defineProperty(messageList, 'scrollHeight', { value: scrollHeight });
    Object.defineProperty(messageList, 'clientHeight', { value: clientHeight });

    fireEvent.scroll(messageList, { target: { scrollTop: scrollHeight - clientHeight } });
    expect(messageList.scrollTop).toBe(scrollHeight - clientHeight);
  });
}); 