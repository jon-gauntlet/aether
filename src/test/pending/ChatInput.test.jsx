import { render, screen, fireEvent } from '../test/utils';
import { ChatInput } from '../components/ChatInput';
import { vi } from 'vitest';

describe('ChatInput', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<ChatInput onSubmit={mockOnSubmit} />);
    expect(screen.getByTestId('chakra-textarea')).toBeInTheDocument();
  });

  it('handles text input', () => {
    render(<ChatInput onSubmit={mockOnSubmit} />);
    const input = screen.getByTestId('chakra-textarea');
    fireEvent.change(input, { target: { value: 'test message' } });
    expect(input.value).toBe('test message');
  });

  it('submits on Enter', () => {
    render(<ChatInput onSubmit={mockOnSubmit} />);
    const input = screen.getByTestId('chakra-textarea');
    fireEvent.change(input, { target: { value: 'test message' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(mockOnSubmit).toHaveBeenCalledWith('test message');
    expect(input.value).toBe('');
  });

  it('does not submit empty messages', () => {
    render(<ChatInput onSubmit={mockOnSubmit} />);
    const input = screen.getByTestId('chakra-textarea');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('handles key commands', () => {
    render(<ChatInput onSubmit={mockOnSubmit} />);
    const input = screen.getByTestId('chakra-textarea');
    fireEvent.change(input, { target: { value: 'test message' } });
    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
    expect(input.value).toBe('');
  });

  it('respects disabled state', () => {
    render(<ChatInput onSubmit={mockOnSubmit} disabled />);
    const input = screen.getByTestId('chakra-textarea');
    expect(input).toBeDisabled();
  });

  it('shows custom placeholder', () => {
    const placeholder = 'Type your message...';
    render(<ChatInput onSubmit={mockOnSubmit} placeholder={placeholder} />);
    const input = screen.getByTestId('chakra-textarea');
    expect(input).toHaveAttribute('placeholder', placeholder);
  });
}); 