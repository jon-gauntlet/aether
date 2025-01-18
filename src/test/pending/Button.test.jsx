import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { Button } from '@/shared/components/Button';
import { TestWrapper } from '@/test/TestWrapper';

describe('Button', () => {
  describe('Render Flow', () => {
    it('renders with default props', () => {
      const { getByRole } = render(
        <TestWrapper>
          <Button>Click me</Button>
        </TestWrapper>
      );
      const button = getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
      expect(button).toHaveClass('bg-primary');
    });

    it('renders children correctly', () => {
      const { getByText } = render(
        <TestWrapper>
          <Button>Test Button</Button>
        </TestWrapper>
      );
      expect(getByText('Test Button')).toBeInTheDocument();
    });

    it('renders in disabled state', () => {
      const { getByRole } = render(
        <TestWrapper>
          <Button disabled>Disabled</Button>
        </TestWrapper>
      );
      expect(getByRole('button')).toBeDisabled();
    });

    it('renders in loading state', () => {
      const { getByRole, getByTestId } = render(
        <TestWrapper>
          <Button loading>Loading</Button>
        </TestWrapper>
      );
      const button = getByRole('button');
      expect(button).toBeDisabled();
      expect(getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Style Flow', () => {
    it('applies custom className', () => {
      const customClass = 'test-class';
      const { getByRole } = render(
        <TestWrapper>
          <Button className={customClass}>Custom Style</Button>
        </TestWrapper>
      );
      expect(getByRole('button')).toHaveClass(customClass);
    });

    it('applies variant styles', () => {
      const { getByRole } = render(
        <TestWrapper>
          <Button variant="secondary">Secondary</Button>
        </TestWrapper>
      );
      expect(getByRole('button')).toHaveClass('bg-secondary');
    });
  });

  describe('Interaction Flow', () => {
    it('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      const { getByRole } = render(
        <TestWrapper>
          <Button onClick={handleClick}>Click me</Button>
        </TestWrapper>
      );
      fireEvent.click(getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const handleClick = vi.fn();
      const { getByRole } = render(
        <TestWrapper>
          <Button onClick={handleClick} disabled>Click me</Button>
        </TestWrapper>
      );
      fireEvent.click(getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', () => {
      const handleClick = vi.fn();
      const { getByRole } = render(
        <TestWrapper>
          <Button onClick={handleClick} loading>Click me</Button>
        </TestWrapper>
      );
      fireEvent.click(getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Props Flow', () => {
    it('forwards additional props', () => {
      const { getByRole } = render(
        <TestWrapper>
          <Button data-testid="test-button" type="submit">Submit</Button>
        </TestWrapper>
      );
      const button = getByRole('button');
      expect(button).toHaveAttribute('data-testid', 'test-button');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });
}); 