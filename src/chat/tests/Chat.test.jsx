/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { Chat } from '../components/Chat';
import { supabase } from '@/services/supabase';

// Mock Supabase client
vi.mock('@/services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [] }),
      insert: vi.fn().mockResolvedValue({ data: [{ id: 1 }] }),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockResolvedValue({}),
    })),
  },
}));

describe('Chat Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
  });

  describe('UI Elements', () => {
    it('renders chat interface with input', () => {
      render(<Chat />);
      expect(screen.getByTestId('chat-input')).toBeInTheDocument();
      expect(screen.getByTestId('messages-container')).toBeInTheDocument();
    });

    it('shows empty state when no messages', () => {
      render(<Chat />);
      expect(screen.getByText(/start a conversation/i)).toBeInTheDocument();
    });
  });

  describe('Message Handling', () => {
    it('handles message input', async () => {
      const user = userEvent.setup();
      render(<Chat />);
      
      const input = screen.getByTestId('chat-input');
      await user.type(input, 'Hello');
      
      expect(input).toHaveValue('Hello');
    });

    it('handles message submission', async () => {
      const user = userEvent.setup();
      render(<Chat />);
      
      const input = screen.getByTestId('chat-input');
      await user.type(input, 'Test message');
      await user.keyboard('{Enter}');
      
      expect(input).toHaveValue('');
    });

    it('shows loading state during message send', async () => {
      const user = userEvent.setup();
      render(<Chat />);
      
      const input = screen.getByTestId('chat-input');
      await user.type(input, 'Test message');
      await user.keyboard('{Enter}');
      
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('subscribes to channel on mount', () => {
      render(<Chat />);
      expect(supabase.channel).toHaveBeenCalled();
    });

    it('updates messages when new message received', async () => {
      const { rerender } = render(<Chat />);
      
      // Simulate new message from subscription
      await waitFor(() => {
        rerender(<Chat />);
        expect(screen.getByText('New message')).toBeInTheDocument();
      });
    });

    it('handles connection errors gracefully', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock subscription error
      supabase.channel.mockImplementationOnce(() => {
        throw new Error('Connection failed');
      });

      render(<Chat />);
      
      expect(screen.getByText(/connection error/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('shows error message when message send fails', async () => {
      // Mock message send failure
      supabase.from().insert.mockRejectedValueOnce(new Error('Failed to send'));
      
      const user = userEvent.setup();
      render(<Chat />);
      
      const input = screen.getByTestId('chat-input');
      await user.type(input, 'Test message');
      await user.keyboard('{Enter}');
      
      expect(screen.getByText(/failed to send/i)).toBeInTheDocument();
    });

    it('allows retry after error', async () => {
      const user = userEvent.setup();
      render(<Chat />);
      
      const input = screen.getByTestId('chat-input');
      await user.type(input, 'Test message');
      await user.keyboard('{Enter}');
      
      const retryButton = screen.getByText(/retry/i);
      await user.click(retryButton);
      
      expect(screen.queryByText(/failed to send/i)).not.toBeInTheDocument();
    });
  });
}); 