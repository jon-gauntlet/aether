import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ChatInput } from '../components/ChatInput';
import { withFlowProtection, createDebugContext, withDebugProtection } from '../core/__tests__/utils/debug-utils';

describe('ChatInput', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onKeyCommand: vi.fn(),
    isDisabled: false,
    placeholder: 'Type a message...',
  };

  let debugContext;

  beforeEach(() => {
    vi.clearAllMocks();
    debugContext = createDebugContext();
  });

  it('renders with default props', withFlowProtection(async () => {
    withDebugProtection(() => {
      render(<ChatInput {...defaultProps} />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Type a message...');
      expect(input).not.toBeDisabled();
    }, debugContext);
  }));

  it('handles text input', withFlowProtection(async () => {
    withDebugProtection(() => {
      render(<ChatInput {...defaultProps} />);
      const input = screen.getByRole('textbox');
      const testValue = 'Hello, world!';

      fireEvent.change(input, { target: { value: testValue } });
      expect(input.value).toBe(testValue);
    }, debugContext);
  }));

  it('submits on Enter', withFlowProtection(async () => {
    withDebugProtection(() => {
      render(<ChatInput {...defaultProps} />);
      const input = screen.getByRole('textbox');
      const testValue = 'Hello, world!';

      fireEvent.change(input, { target: { value: testValue } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(defaultProps.onSubmit).toHaveBeenCalledWith(testValue);
      expect(input.value).toBe('');
    }, debugContext);
  }));

  it('does not submit empty messages', withFlowProtection(async () => {
    withDebugProtection(() => {
      render(<ChatInput {...defaultProps} />);
      const input = screen.getByRole('textbox');

      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    }, debugContext);
  }));

  it('handles key commands', withFlowProtection(async () => {
    withDebugProtection(() => {
      render(<ChatInput {...defaultProps} />);
      const input = screen.getByRole('textbox');

      fireEvent.keyDown(input, { key: 'ArrowUp' });
      expect(defaultProps.onKeyCommand).toHaveBeenCalledWith('ArrowUp');

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(defaultProps.onKeyCommand).toHaveBeenCalledWith('ArrowDown');
    }, debugContext);
  }));

  it('respects disabled state', withFlowProtection(async () => {
    withDebugProtection(() => {
      render(<ChatInput {...defaultProps} isDisabled={true} />);
      const input = screen.getByRole('textbox');
      
      expect(input).toBeDisabled();
      
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    }, debugContext);
  }));

  it('shows custom placeholder', withFlowProtection(async () => {
    withDebugProtection(() => {
      const customPlaceholder = 'Custom placeholder...';
      render(<ChatInput {...defaultProps} placeholder={customPlaceholder} />);
      const input = screen.getByRole('textbox');
      
      expect(input).toHaveAttribute('placeholder', customPlaceholder);
    }, debugContext);
  }));

  afterEach(() => {
    const analysis = analyzeDebugContext(debugContext);
    if (analysis.warningCount > 0) {
      console.warn('Test optimization recommendations:', analysis.recommendations);
    }
  });
}); 