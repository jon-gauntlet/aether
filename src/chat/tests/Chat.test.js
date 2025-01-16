import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Chat } from '../components/Chat';
import * as chatApi from '../api/chat';

// Mock API
jest.mock('../api/chat', () => ({
  sendMessage: jest.fn(),
  getMessages: jest.fn()
}));

describe('Chat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    chatApi.getMessages.mockResolvedValue([]);
    Element.prototype.scrollIntoView = jest.fn();
  });

  // Natural flow: setup → action → verify
  describe('Message Flow', () => {
    it('sends and receives messages', async () => {
      // Setup
      chatApi.sendMessage.mockResolvedValueOnce({
        text: 'Response message',
        metrics: { latency: 100 }
      });

      render(<Chat />);
      
      // Action
      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), {
          target: { value: 'Test message' }
        });
        fireEvent.click(screen.getByRole('button'));
      });

      // Verify
      expect(screen.getByText('Test message')).toBeInTheDocument();
      expect(screen.getByText('Response message')).toBeInTheDocument();
    });

    it('shows loading state', async () => {
      // Setup
      let resolveApi;
      chatApi.sendMessage.mockImplementationOnce(
        () => new Promise(resolve => { resolveApi = resolve; })
      );

      render(<Chat />);
      
      // Action
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'Test message' }
      });
      fireEvent.click(screen.getByRole('button'));

      // Verify loading
      expect(screen.getByText('Sending...')).toBeInTheDocument();
      
      // Complete loading
      await act(async () => {
        resolveApi({ text: 'Response', metrics: { latency: 100 } });
      });
    });

    it('handles errors', async () => {
      // Setup
      chatApi.sendMessage.mockRejectedValueOnce(new Error('API Error'));

      render(<Chat />);
      
      // Action
      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), {
          target: { value: 'Test message' }
        });
        fireEvent.click(screen.getByRole('button'));
      });

      // Verify
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  describe('UI Flow', () => {
    it('shows empty state', () => {
      render(<Chat />);
      expect(screen.getByText(/Start a conversation/)).toBeInTheDocument();
    });

    it('disables input while loading', async () => {
      // Setup
      let resolveApi;
      chatApi.sendMessage.mockImplementationOnce(
        () => new Promise(resolve => { resolveApi = resolve; })
      );

      render(<Chat />);
      
      // Action
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'Test message' }
      });
      fireEvent.click(screen.getByRole('button'));

      // Verify
      expect(screen.getByRole('textbox')).toBeDisabled();
      expect(screen.getByRole('button')).toBeDisabled();
      
      // Complete loading
      await act(async () => {
        resolveApi({ text: 'Response', metrics: { latency: 100 } });
      });
    });
  });
}); 