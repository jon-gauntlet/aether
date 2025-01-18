import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils';
import { Input } from '../../../shared/components/Input';

describe('Input', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Render Flow', () => {
    it('renders with default props', () => {
      render(<Input aria-label="test-input" />);
      expect(screen.getByRole('textbox', { name: /test-input/i })).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter text" aria-label="test-input" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(
        <Input 
          label="Test Label" 
          aria-label="test-input"
        />
      );
      expect(screen.getByRole('textbox', { name: /test-input/i })).toBeInTheDocument();
    });

    it('renders in disabled state', () => {
      render(<Input disabled aria-label="test-input" />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });
  });

  describe('Value Flow', () => {
    it('displays initial value', () => {
      render(<Input value="Initial text" aria-label="test-input" readOnly />);
      expect(screen.getByRole('textbox')).toHaveValue('Initial text');
    });

    it('updates value on change', () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} aria-label="test-input" />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'New text' } });
      
      expect(handleChange).toHaveBeenCalled();
      expect(input).toHaveValue('New text');
    });
  });

  describe('Style Flow', () => {
    it('applies error styles', () => {
      render(<Input className="border-red-500" aria-invalid="true" aria-label="test-input" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('border-red-500');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('applies custom className', () => {
      render(<Input className="custom-class" aria-label="test-input" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('custom-class');
    });
  });

  describe('Props Flow', () => {
    it('forwards additional props', () => {
      render(<Input data-testid="custom-input" maxLength={10} aria-label="test-input" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('data-testid', 'custom-input');
      expect(input).toHaveAttribute('maxLength', '10');
    });
  });
}); 