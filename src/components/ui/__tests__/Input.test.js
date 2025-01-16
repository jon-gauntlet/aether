import React from 'react';
import {
  render,
  screen,
  fireEvent,
  createMockEvent,
  typeIntoField,
  waitForLoadingToComplete,
} from '../../test/utils/test-utils';
import { Input } from '../Input';

describe('Input', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockReset();
  });

  it('renders correctly', () => {
    render(<Input onSubmit={mockOnSubmit} />);
    
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('handles text input correctly', async () => {
    render(<Input onSubmit={mockOnSubmit} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    await typeIntoField(input, 'Hello, world!');
    
    expect(input.value).toBe('Hello, world!');
  });

  it('handles form submission correctly', async () => {
    render(<Input onSubmit={mockOnSubmit} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const button = screen.getByRole('button');
    
    await typeIntoField(input, 'Test message');
    fireEvent.click(button);
    
    await waitForLoadingToComplete(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('Test message');
      expect(input.value).toBe('');
    });
  });

  it('prevents empty submission', async () => {
    render(<Input onSubmit={mockOnSubmit} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('handles loading state correctly', () => {
    render(<Input onSubmit={mockOnSubmit} isLoading={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Sending...');
  });

  it('handles keyboard submission', async () => {
    render(<Input onSubmit={mockOnSubmit} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    await typeIntoField(input, 'Test message');
    
    fireEvent.keyPress(input, {
      key: 'Enter',
      code: 'Enter',
      charCode: 13,
    });
    
    await waitForLoadingToComplete(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('Test message');
      expect(input.value).toBe('');
    });
  });

  it('trims whitespace from input', async () => {
    render(<Input onSubmit={mockOnSubmit} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    await typeIntoField(input, '  Test message  ');
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitForLoadingToComplete(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('Test message');
    });
  });
}); 