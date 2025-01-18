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

import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, fireEvent } from '../../../test/utils';
import { Message } from '../Message';

// Mock the reaction functionality since it's tested separately
const mockAddReaction = vi.fn();
vi.mock('../../../core/messaging/MessageProvider', () => ({
  useMessages: () => ({
    addReaction: mockAddReaction
  })
}));

describe('Message', () => {
  it('should handle valid timestamp', () => {
    const timestamp = '2024-01-17T12:00:00Z';
    renderWithProviders(<Message content="Test" timestamp={timestamp} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText(/Jan 17, 2024/)).toBeInTheDocument();
  });

  it('should handle missing timestamp', () => {
    renderWithProviders(<Message content="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.queryByText(/\d{4}/)).not.toBeInTheDocument();
  });

  it('should handle invalid timestamp', () => {
    renderWithProviders(<Message content="Test" timestamp="invalid-date" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.queryByText(/\d{4}/)).not.toBeInTheDocument();
  });

  it('should display thread indicator', () => {
    const threadId = '123';
    renderWithProviders(<Message content="Test" threadId={threadId} />);
    expect(screen.getByText('View thread')).toBeInTheDocument();
  });

  it('should handle thread click', () => {
    const onThreadClick = vi.fn();
    const messageId = '123';
    renderWithProviders(
      <Message 
        content="Test" 
        messageId={messageId} 
        onThreadClick={onThreadClick} 
      />
    );
    
    fireEvent.click(screen.getByLabelText('Open thread'));
    expect(onThreadClick).toHaveBeenCalledWith(messageId);
  });

  it('should display loading skeleton', () => {
    renderWithProviders(<Message content="Test" isLoading={true} />);
    expect(screen.getAllByTestId('skeleton')).toHaveLength(2);
  });

  it('should display attachments', () => {
    const attachments = [
      { name: 'test.pdf', url: 'http://test.com/test.pdf' }
    ];
    renderWithProviders(<Message content="Test" attachments={attachments} />);
    const link = screen.getByText('test.pdf');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', 'http://test.com/test.pdf');
  });
}); 