import { render, screen } from '@testing-library/react';
import { TestWrapper } from './setup';
import { Message } from '../shared/components/Message';

describe('Message', () => {
  describe('Basic Rendering', () => {
    test('renders user message correctly', () => {
      const message = {
        id: '1',
        sender: 'User',
        content: 'Hello',
        reactions: []
      };
      render(<Message message={message} isUser={true} />, { wrapper: TestWrapper });
      
      const messageElement = screen.getByTestId('message-user');
      expect(messageElement).toBeInTheDocument();
      expect(messageElement).toHaveTextContent('Hello');
    });

    test('renders assistant message correctly', () => {
      const message = {
        id: '2',
        sender: 'Assistant',
        content: 'Hi there',
        reactions: []
      };
      render(<Message message={message} isUser={false} />, { wrapper: TestWrapper });
      
      const messageElement = screen.getByTestId('message-assistant');
      expect(messageElement).toBeInTheDocument();
      expect(messageElement).toHaveTextContent('Hi there');
    });

    test('renders code blocks correctly', () => {
      const message = {
        id: '3',
        sender: 'Assistant',
        content: 'Here is some code:',
        code: 'console.log("test");',
        reactions: []
      };
      render(<Message message={message} isUser={false} />, { wrapper: TestWrapper });
      
      expect(screen.getByTestId('code-block')).toBeInTheDocument();
      expect(screen.getByText('console.log("test");')).toBeInTheDocument();
    });
  });

  describe('Timestamp Handling', () => {
    test('renders timestamp when provided', () => {
      const message = {
        id: '4',
        sender: 'User',
        content: 'Hello',
        timestamp: new Date('2024-01-01T12:00:00').toISOString(),
        reactions: []
      };
      render(<Message message={message} isUser={true} />, { wrapper: TestWrapper });
      
      expect(screen.getByTestId('message-timestamp')).toBeInTheDocument();
    });

    test('does not render timestamp when not provided', () => {
      const message = {
        id: '5',
        sender: 'User',
        content: 'Hello',
        reactions: []
      };
      render(<Message message={message} isUser={true} />, { wrapper: TestWrapper });
      
      expect(screen.queryByTestId('message-timestamp')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('renders error message when provided', () => {
      const message = {
        id: '6',
        sender: 'Assistant',
        content: 'Error occurred',
        error: true,
        reactions: []
      };
      render(<Message message={message} isUser={false} />, { wrapper: TestWrapper });
      
      expect(screen.getByTestId('message-error')).toBeInTheDocument();
      expect(screen.getByText('Failed to process message')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    test('shows loading indicator when loading', () => {
      const message = {
        id: '7',
        sender: 'Assistant',
        content: '',
        loading: true,
        reactions: []
      };
      render(<Message message={message} isUser={false} />, { wrapper: TestWrapper });
      
      expect(screen.getByTestId('message-loading')).toBeInTheDocument();
    });
  });
}); 