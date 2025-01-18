import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Message } from '../Message';

describe('Message', () => {
  it('renders message content', () => {
    render(
      <Message 
        content="Test message" 
        role="article"
        data-testid="message"
      />
    );
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByTestId('message')).toHaveAttribute('role', 'article');
  });

  it('applies correct styling based on type', () => {
    render(
      <Message 
        content="Test message" 
        type="error" 
        role="alert"
        data-testid="message"
      />
    );
    const message = screen.getByTestId('message');
    expect(message).toHaveClass('error');
    expect(message).toHaveAttribute('role', 'alert');
  });

  it('handles system messages', () => {
    render(
      <Message 
        content="System notification" 
        type="system" 
        role="status"
        data-testid="message"
      />
    );
    const message = screen.getByTestId('message');
    expect(message).toHaveClass('system');
    expect(message).toHaveAttribute('role', 'status');
    expect(message).toHaveTextContent('System notification');
  });

  it('renders timestamps when provided', () => {
    const timestamp = new Date('2024-01-01T12:00:00Z').toISOString();
    render(
      <Message 
        content="Test message" 
        timestamp={timestamp}
        role="article"
        data-testid="message"
      />
    );
    expect(screen.getByTestId('message-timestamp')).toBeInTheDocument();
    expect(screen.getByTestId('message-timestamp')).toHaveTextContent('12:00');
  });

  it('handles user messages', () => {
    render(
      <Message 
        content="User message" 
        type="user" 
        role="article"
        data-testid="message"
      />
    );
    const message = screen.getByTestId('message');
    expect(message).toHaveClass('user');
    expect(message).toHaveTextContent('User message');
  });

  it('handles long messages with proper wrapping', () => {
    const longMessage = 'A'.repeat(100);
    render(
      <Message 
        content={longMessage} 
        role="article"
        data-testid="message"
      />
    );
    const message = screen.getByTestId('message');
    expect(message).toBeInTheDocument();
    expect(message).toHaveTextContent(longMessage);
  });
}); 