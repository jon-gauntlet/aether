import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Input from '../Input';

describe('Input', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default state', () => {
    const mockOnSubmit = vi.fn();
    render(<Input onSubmit={mockOnSubmit} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const submitButton = screen.getByText('Send');
    
    expect(input).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when text is entered', async () => {
    const mockOnSubmit = vi.fn();
    const user = userEvent.setup();
    render(<Input onSubmit={mockOnSubmit} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const submitButton = screen.getByText('Send');
    
    await user.type(input, 'Test message');
    
    expect(submitButton).not.toBeDisabled();
  });

  it('submits text on button click', async () => {
    const mockOnSubmit = vi.fn();
    const user = userEvent.setup();
    render(<Input onSubmit={mockOnSubmit} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const submitButton = screen.getByText('Send');
    
    await user.type(input, 'Test message');
    await user.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith('Test message');
    expect(input).toHaveValue('');
  });

  it('submits text on Enter key press', async () => {
    const mockOnSubmit = vi.fn();
    const user = userEvent.setup();
    render(<Input onSubmit={mockOnSubmit} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    
    await user.type(input, 'Test message');
    await user.keyboard('{Enter}');
    
    expect(mockOnSubmit).toHaveBeenCalledWith('Test message');
    expect(input).toHaveValue('');
  });

  it('handles loading state', () => {
    const mockOnSubmit = vi.fn();
    render(<Input onSubmit={mockOnSubmit} isLoading={true} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const submitButton = screen.getByText('Sending...');
    
    expect(input).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('preserves newlines with Shift+Enter', async () => {
    const mockOnSubmit = vi.fn();
    const user = userEvent.setup();
    render(<Input onSubmit={mockOnSubmit} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    
    await user.type(input, 'Line 1');
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    await user.type(input, 'Line 2');
    
    expect(input).toHaveValue('Line 1\nLine 2');
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
}); 