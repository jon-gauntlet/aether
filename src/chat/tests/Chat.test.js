import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Chat } from '../index';

vi.mock('@/core/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-user' },
  },
}));

describe('Chat', () => {
  it('renders chat interface', () => {
    render(<Chat />);
    const input = screen.getByRole('textbox', { name: /message/i });
    expect(input).toBeInTheDocument();
  });

  it('handles message input', async () => {
    const user = userEvent.setup();
    render(<Chat />);
    
    const input = screen.getByRole('textbox', { name: /message/i });
    await user.type(input, 'Hello');
    
    expect(input).toHaveValue('Hello');
  });

  it('handles message submission', async () => {
    const user = userEvent.setup();
    render(<Chat />);
    
    const input = screen.getByRole('textbox', { name: /message/i });
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    await user.type(input, 'Test message');
    await user.click(sendButton);
    
    expect(input).toHaveValue('');
  });

  it('shows loading state during message processing', async () => {
    const user = userEvent.setup();
    render(<Chat />);
    
    const input = screen.getByRole('textbox', { name: /message/i });
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    await user.type(input, 'Test message');
    await user.click(sendButton);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
}); 