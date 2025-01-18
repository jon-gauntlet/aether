import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { Input } from '@/shared/components/Input';
import { TestWrapper } from '@/test/utils';

describe('Input', () => {
  describe('Render Flow', () => {
    it('renders with default props', () => {
      const { getByRole } = render(
        <TestWrapper>
          <Input />
        </TestWrapper>
      );
      const input = getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).not.toBeDisabled();
      expect(input).not.toHaveAttribute('aria-invalid');
    });

    it('renders with placeholder', () => {
      const placeholder = 'Enter text...';
      const { getByPlaceholderText } = render(
        <TestWrapper>
          <Input placeholder={placeholder} />
        </TestWrapper>
      );
      expect(getByPlaceholderText(placeholder)).toBeInTheDocument();
    });

    it('renders with label', () => {
      const label = 'Test Label';
      const { getByLabelText } = render(
        <TestWrapper>
          <Input label={label} />
        </TestWrapper>
      );
      expect(getByLabelText(label)).toBeInTheDocument();
    });

    it('renders in disabled state', () => {
      const { getByRole } = render(
        <TestWrapper>
          <Input disabled />
        </TestWrapper>
      );
      expect(getByRole('textbox')).toBeDisabled();
    });
  });

  describe('Value Flow', () => {
    it('displays initial value', () => {
      const value = 'Initial Value';
      const { getByDisplayValue } = render(
        <TestWrapper>
          <Input value={value} onChange={() => {}} />
        </TestWrapper>
      );
      expect(getByDisplayValue(value)).toBeInTheDocument();
    });

    it('updates value on change', () => {
      const handleChange = vi.fn();
      const { getByRole } = render(
        <TestWrapper>
          <Input onChange={handleChange} />
        </TestWrapper>
      );
      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: 'New Value' } });
      expect(handleChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Style Flow', () => {
    it('applies error styles', () => {
      const { getByRole } = render(
        <TestWrapper>
          <Input error="Error message" />
        </TestWrapper>
      );
      const input = getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveClass('border-red-500');
    });

    it('applies custom className', () => {
      const customClass = 'test-class';
      const { getByRole } = render(
        <TestWrapper>
          <Input className={customClass} />
        </TestWrapper>
      );
      expect(getByRole('textbox')).toHaveClass(customClass);
    });

    it('applies focus styles', () => {
      const { getByRole } = render(
        <TestWrapper>
          <Input />
        </TestWrapper>
      );
      const input = getByRole('textbox');
      fireEvent.focus(input);
      expect(input).toHaveClass('ring-2');
    });
  });

  describe('Props Flow', () => {
    it('forwards additional props', () => {
      const { getByRole } = render(
        <TestWrapper>
          <Input data-testid="test-input" maxLength={10} />
        </TestWrapper>
      );
      const input = getByRole('textbox');
      expect(input).toHaveAttribute('data-testid', 'test-input');
      expect(input).toHaveAttribute('maxLength', '10');
    });
  });
}); 