/**
 * Message Component Tests
 * 
 * Test coverage:
 * 1. Content rendering
 * 2. Timestamp handling
 * 3. Loading states
 * 4. Thread functionality
 * 5. Attachment display
 * 
 * Note: Reaction functionality is tested in:
 * src/components/reactions/ReactionDisplay.test.jsx
 * 
 * Dependencies:
 * - MessageProvider
 * - ReactionProvider (mocked here)
 * - SpaceProvider
 */

import React from 'react';
import { render, screen, fireEvent } from '../../../test/utils';
import { vi } from 'vitest';
import { Message } from '../Message';

vi.mock('@chakra-ui/react', () => ({
  Box: ({ children, ...props }) => <div {...props}>{children}</div>,
  Text: ({ children, ...props }) => <p {...props}>{children}</p>,
  Flex: ({ children, ...props }) => <div {...props}>{children}</div>,
  Skeleton: ({ children, ...props }) => <div data-testid="skeleton" {...props}>{children}</div>,
  HStack: ({ children, ...props }) => <div {...props}>{children}</div>,
  useColorMode: () => ({ colorMode: 'light', toggleColorMode: vi.fn() }),
  IconButton: ({ children, icon, ...props }) => (
    <button data-testid="thread-button" {...props}>
      {icon}
      {children}
    </button>
  ),
  ChatIcon: () => <span data-testid="chat-icon">Chat</span>,
}));

vi.mock('../../../core/reactions/ReactionProvider', () => ({
  useReactions: () => ({
    reactions: [],
    addReaction: vi.fn(),
    removeReaction: vi.fn(),
  }),
}));

vi.mock('../../../core/spaces/SpaceProvider', () => ({
  useSpaces: () => ({
    currentSpace: { id: 'test-space', name: 'Test Space' },
    spaces: [],
  }),
}));

vi.mock('../MessageContent', () => ({
  MessageContent: ({ content }) => <div data-testid="message-content">{content}</div>,
}));

vi.mock('../../reactions/ReactionDisplay', () => ({
  ReactionDisplay: () => <div data-testid="reaction-display">Reactions</div>,
}));

describe('Message Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Content Rendering', () => {
    it('renders message content', () => {
      render(<Message content="Test message" timestamp={new Date().toISOString()} />);
      expect(screen.getByTestId('message-content')).toHaveTextContent('Test message');
    });

    it('displays loading skeleton when isLoading is true', () => {
      render(<Message isLoading content="Test message" timestamp={new Date().toISOString()} />);
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons).toHaveLength(2);
    });

    it('renders timestamp', () => {
      const timestamp = new Date('2024-01-17T20:10:36').toISOString();
      render(<Message content="Test message" timestamp={timestamp} />);
      expect(screen.getByTestId('message-timestamp')).toHaveTextContent('Jan 17, 2024, 8:10:36 PM');
    });

    it('applies custom styles', () => {
      render(<Message content="Test message" timestamp={new Date().toISOString()} className="custom-class" />);
      expect(screen.getByTestId('message-container')).toHaveClass('custom-class');
    });

    it('renders reaction display', () => {
      render(<Message content="Test message" messageId="123" timestamp={new Date().toISOString()} />);
      expect(screen.getByTestId('reaction-display')).toBeInTheDocument();
    });
  });

  describe('Thread Functionality', () => {
    it('shows thread button when onThreadClick is provided', () => {
      render(
        <Message 
          content="Test message" 
          messageId="123"
          timestamp={new Date().toISOString()} 
          onThreadClick={() => {}}
        />
      );
      expect(screen.getByTestId('thread-button')).toBeInTheDocument();
    });

    it('calls onThreadClick when thread button is clicked', () => {
      const handleThreadClick = vi.fn();
      render(
        <Message 
          content="Test message" 
          messageId="123"
          timestamp={new Date().toISOString()} 
          onThreadClick={handleThreadClick}
        />
      );
      fireEvent.click(screen.getByTestId('thread-button'));
      expect(handleThreadClick).toHaveBeenCalledWith('123');
    });

    it('shows thread indicator when threadId is provided', () => {
      render(
        <Message 
          content="Test message" 
          messageId="123"
          threadId="thread-1"
          timestamp={new Date().toISOString()} 
        />
      );
      expect(screen.getByTestId('thread-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('thread-link')).toHaveTextContent('View thread');
    });

    it('calls onThreadClick when thread link is clicked', () => {
      const handleThreadClick = vi.fn();
      render(
        <Message 
          content="Test message" 
          messageId="123"
          threadId="thread-1"
          timestamp={new Date().toISOString()} 
          onThreadClick={handleThreadClick}
        />
      );
      fireEvent.click(screen.getByTestId('thread-link'));
      expect(handleThreadClick).toHaveBeenCalledWith('thread-1');
    });
  });
}); 