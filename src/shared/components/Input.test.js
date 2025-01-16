import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './Input';

describe('Input', () => {
  // Natural flow: setup → render → verify
  describe('Render Flow', () => {
    it('renders with default type', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
    });

    it('renders with custom type', () => {
      render(<Input type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('applies disabled styles', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:bg-gray-100');
    });
  });

  describe('Value Flow', () => {
    it('displays initial value', () => {
      render(<Input value="initial" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('initial');
    });

    it('updates value on change', () => {
      const handleChange = jest.fn();
      render(<Input value="test" onChange={handleChange} />);
      
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'new value' }
      });
      
      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange.mock.calls[0][0].target.value).toBe('new value');
    });
  });

  describe('Style Flow', () => {
    it('applies focus styles', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus:ring-2', 'focus:ring-blue-500');
    });

    it('applies transition styles', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toHaveClass('transition-colors');
    });

    it('applies base styles', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('flex-1', 'p-2', 'border', 'rounded-lg');
    });
  });

  describe('Props Flow', () => {
    it('passes through additional props', () => {
      render(<Input data-testid="custom-input" aria-label="test input" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('data-testid', 'custom-input');
      expect(input).toHaveAttribute('aria-label', 'test input');
    });
  });
}); 