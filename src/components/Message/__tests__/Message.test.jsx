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
import { useAuth } from '../../../contexts/AuthContext';

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

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('../../FormattedMessage', () => ({
  default: ({ text }) => <div data-testid="formatted-message">{text}</div>
}));

describe('Message Component', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com'
  }

  beforeEach(() => {
    useAuth.mockReturnValue({ user: mockUser })
  })

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

  describe('Message Status', () => {
    it('renders own message with sending status', () => {
      const message = {
        id: '1',
        text: 'Hello',
        status: 'sending',
        user_id: mockUser.id,
        user_email: mockUser.email,
        read_receipts: []
      }

      render(<Message message={message} />)

      expect(screen.getByText('Sending')).toBeInTheDocument()
      expect(screen.getByTestId('formatted-message')).toHaveTextContent('Hello')
    })

    it('renders own message with sent status', () => {
      const message = {
        id: '1',
        text: 'Hello',
        status: 'sent',
        user_id: mockUser.id,
        user_email: mockUser.email,
        read_receipts: []
      }

      render(<Message message={message} />)

      expect(screen.getByText('Sent')).toBeInTheDocument()
    })

    it('renders own message with delivered status', () => {
      const message = {
        id: '1',
        text: 'Hello',
        status: 'delivered',
        user_id: mockUser.id,
        user_email: mockUser.email,
        read_receipts: []
      }

      render(<Message message={message} />)

      expect(screen.getByText('Delivered')).toBeInTheDocument()
    })

    it('renders own message with read receipts', () => {
      const message = {
        id: '1',
        text: 'Hello',
        status: 'delivered',
        user_id: mockUser.id,
        user_email: mockUser.email,
        read_receipts: [
          { user_id: 'user-2', read_at: new Date().toISOString() },
          { user_id: 'user-3', read_at: new Date().toISOString() }
        ]
      }

      render(<Message message={message} />)

      expect(screen.getByText('Read by 2')).toBeInTheDocument()
    })

    it('renders other user message with email', () => {
      const message = {
        id: '1',
        text: 'Hello',
        status: 'sent',
        user_id: 'other-user',
        user_email: 'other@example.com',
        read_receipts: []
      }

      render(<Message message={message} onRead={vi.fn()} />)

      expect(screen.getByText('other@example.com')).toBeInTheDocument()
    })

    it('calls onRead when rendering other user message', () => {
      const onRead = vi.fn()
      const message = {
        id: '1',
        text: 'Hello',
        status: 'sent',
        user_id: 'other-user',
        user_email: 'other@example.com',
        read_receipts: []
      }

      render(<Message message={message} onRead={onRead} />)

      expect(onRead).toHaveBeenCalledWith(message.id)
    })

    it('renders message with attachments', () => {
      const message = {
        id: '1',
        text: 'Check this out',
        status: 'sent',
        user_id: mockUser.id,
        user_email: mockUser.email,
        read_receipts: [],
        attachments: [
          {
            name: 'test.pdf',
            url: 'https://example.com/test.pdf',
            type: 'application/pdf'
          }
        ]
      }

      render(<Message message={message} />)

      const attachment = screen.getByText('test.pdf')
      expect(attachment).toBeInTheDocument()
      expect(attachment.closest('a')).toHaveAttribute('href', 'https://example.com/test.pdf')
    })

    it('renders image attachments inline', () => {
      const message = {
        id: '1',
        text: 'Check this image',
        status: 'sent',
        user_id: mockUser.id,
        user_email: mockUser.email,
        read_receipts: [],
        attachments: [
          {
            name: 'test.jpg',
            url: 'https://example.com/test.jpg',
            type: 'image/jpeg'
          }
        ]
      }

      render(<Message message={message} />)

      const image = screen.getByAltText('test.jpg')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', 'https://example.com/test.jpg')
    })
  })
}) 