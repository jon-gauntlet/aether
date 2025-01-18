import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Input', () => {
  it('renders correctly', () => {
    render(<Input aria-label="test-input" />);
    expect(screen.getByRole('textbox', { name: /test-input/i })).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Input value="" onChange={onChange} aria-label="test-input" />);
    
    const input = screen.getByRole('textbox', { name: /test-input/i });
    await user.type(input, 'test');
    
    expect(onChange).toHaveBeenCalled();
    expect(input).toHaveValue('test');
  });

  it('respects maxLength prop', async () => {
    const user = userEvent.setup();
    render(<Input maxLength={5} aria-label="test-input" />);
    
    const input = screen.getByRole('textbox', { name: /test-input/i });
    await user.type(input, '123456');
    
    expect(input).toHaveValue('12345');
  });

  it('handles disabled state', () => {
    render(<Input disabled aria-label="test-input" />);
    expect(screen.getByRole('textbox', { name: /test-input/i })).toBeDisabled();
  });

  it('applies placeholder text', () => {
    render(<Input placeholder="Enter text" aria-label="test-input" />);
    const input = screen.getByRole('textbox', { name: /test-input/i });
    expect(input).toHaveAttribute('placeholder', 'Enter text');
  });

  it('handles focus and blur events', async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const user = userEvent.setup();
    
    render(
      <Input 
        onFocus={onFocus} 
        onBlur={onBlur} 
        aria-label="test-input" 
      />
    );
    
    const input = screen.getByRole('textbox', { name: /test-input/i });
    await user.click(input);
    expect(onFocus).toHaveBeenCalled();
    
    await user.tab();
    expect(onBlur).toHaveBeenCalled();
  });
}); 