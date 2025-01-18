import { render, screen } from '@testing-library/react';
import { TestWrapper } from './setup';
import { Message } from '../shared/components/Message';

describe('Message', () => {
  describe('Basic Rendering', () => {
    test('renders user message correctly', () => {
      const message = { role: 'user', content: 'Hello' };
      render(<Message message={message} isUser={true} />, { wrapper: TestWrapper });
      
      const messageElement = screen.getByTestId('message-user');
      expect(messageElement).toBeInTheDocument();
      expect(messageElement).toHaveTextContent('Hello');
    });

    test('renders assistant message correctly', () => {
      const message = { role: 'assistant', content: 'Hi there' };
      render(<Message message={message} isUser={false} />, { wrapper: TestWrapper });
      
      const messageElement = screen.getByTestId('message-assistant');
      expect(messageElement).toBeInTheDocument();
      expect(messageElement).toHaveTextContent('Hi there');
    });

    test('renders code blocks correctly', () => {
      const message = {
        role: 'assistant',
        content: 'Here is some code:',
        code: 'console.log("test");'
      };
      render(<Message message={message} isUser={false} />, { wrapper: TestWrapper });
      
      expect(screen.getByTestId('code-block')).toBeInTheDocument();
      expect(screen.getByText('console.log("test");')).toBeInTheDocument();
    });
  });

  describe('Timestamp Handling', () => {
    test('renders timestamp when provided', () => {
      const message = {
        role: 'user',
        content: 'Hello',
        timestamp: new Date('2024-01-01T12:00:00').toISOString()
      };
      render(<Message message={message} isUser={true} />, { wrapper: TestWrapper });
      
      expect(screen.getByTestId('message-timestamp')).toBeInTheDocument();
    });

    test('does not render timestamp when not provided', () => {
      const message = { role: 'user', content: 'Hello' };
      render(<Message message={message} isUser={true} />, { wrapper: TestWrapper });
      
      expect(screen.queryByTestId('message-timestamp')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('renders error message when provided', () => {
      const message = {
        role: 'assistant',
        content: 'Error occurred',
        error: 'Failed to process message'
      };
      render(<Message message={message} isUser={false} />, { wrapper: TestWrapper });
      
      expect(screen.getByText('Failed to process message')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    test('shows loading indicator when loading', () => {
      const message = { role: 'assistant', content: '', isLoading: true };
      render(<Message message={message} isUser={false} />, { wrapper: TestWrapper });
      
      expect(screen.getByTestId('message-loading')).toBeInTheDocument();
    });
  });
}); 