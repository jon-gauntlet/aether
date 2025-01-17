import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ChatInput } from '@/components/ChatInput';

describe('ChatInput', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onKeyCommand: vi.fn(),
    isDisabled: false,
    placeholder: 'Type a message...',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<ChatInput {...defaultProps} />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Type a message...');
    expect(input).not.toBeDisabled();
  });

  it('handles text input', () => {
    render(<ChatInput {...defaultProps} />);
    const input = screen.getByRole('textbox');
    const testValue = 'Hello, world!';

    fireEvent.change(input, { target: { value: testValue } });
    expect(input.value).toBe(testValue);
  });

  it('submits on Enter', () => {
    render(<ChatInput {...defaultProps} />);
    const input = screen.getByRole('textbox');
    const testValue = 'Hello, world!';

    fireEvent.change(input, { target: { value: testValue } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(defaultProps.onSubmit).toHaveBeenCalledWith(testValue);
    expect(input.value).toBe('');
  });

  it('does not submit empty messages', () => {
    render(<ChatInput {...defaultProps} />);
    const input = screen.getByRole('textbox');

    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('handles key commands', () => {
    render(<ChatInput {...defaultProps} />);
    const input = screen.getByRole('textbox');

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(defaultProps.onKeyCommand).toHaveBeenCalledWith('ArrowUp');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(defaultProps.onKeyCommand).toHaveBeenCalledWith('ArrowDown');
  });

  it('respects disabled state', () => {
    render(<ChatInput {...defaultProps} isDisabled={true} />);
    const input = screen.getByRole('textbox');
    
    expect(input).toBeDisabled();
    
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('shows custom placeholder', () => {
    const customPlaceholder = 'Custom placeholder...';
    render(<ChatInput {...defaultProps} placeholder={customPlaceholder} />);
    const input = screen.getByRole('textbox');
    
    expect(input).toHaveAttribute('placeholder', customPlaceholder);
  });
}); 