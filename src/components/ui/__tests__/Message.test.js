import React from 'react';
import { render, screen } from '@testing-library/react';
import { createMockProps, createMockError, withErrorHandling } from '../../../utils/testUtils';
import Message from '../Message';

// Mock validation rules schema
const mockSchema = {
  message: {
    type: 'Object',
    required: true,
    validate: () => true
  }
};

describe('Message Component', () => {
  // Basic rendering tests
  describe('Rendering', () => {
    it('should render user message correctly', () => {
      const props = createMockProps(mockSchema, {
        message: {
          text: 'Hello world',
          isUser: true
        }
      });

      render(<Message {...props} />);
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    it('should render system message correctly', () => {
      const props = createMockProps(mockSchema, {
        message: {
          text: 'System response',
          isUser: false
        }
      });

      render(<Message {...props} />);
      expect(screen.getByText('System response')).toBeInTheDocument();
    });

    it('should render error message with correct styling', () => {
      const props = createMockProps(mockSchema, {
        message: {
          text: 'Error occurred',
          error: true
        }
      });

      const { container } = render(<Message {...props} />);
      expect(container.firstChild).toHaveClass('bg-red-100');
    });
  });

  // Results rendering tests
  describe('Results Handling', () => {
    it('should render results when provided', () => {
      const props = createMockProps(mockSchema, {
        message: {
          text: 'Message with results',
          results: [
            { text: 'Result 1', metadata: { source: 'test1' } },
            { text: 'Result 2', metadata: { source: 'test2' } }
          ]
        }
      });

      render(<Message {...props} />);
      expect(screen.getByText('Result 1')).toBeInTheDocument();
      expect(screen.getByText('Result 2')).toBeInTheDocument();
    });

    it('should render metadata correctly', () => {
      const props = createMockProps(mockSchema, {
        message: {
          text: 'Message with metadata',
          results: [
            { text: 'Result', metadata: { source: 'test', confidence: '0.9' } }
          ]
        }
      });

      render(<Message {...props} />);
      expect(screen.getByText('source:')).toBeInTheDocument();
      expect(screen.getByText('confidence:')).toBeInTheDocument();
    });
  });

  // Validation tests
  describe('Validation', () => {
    it('should throw error for missing text', () => {
      const props = createMockProps(mockSchema, {
        message: {
          isUser: true
        }
      });

      expect(() => {
        render(<Message {...props} />);
      }).toThrow();
    });

    it('should throw error for invalid results structure', () => {
      const props = createMockProps(mockSchema, {
        message: {
          text: 'Invalid results',
          results: 'not an array'
        }
      });

      expect(() => {
        render(<Message {...props} />);
      }).toThrow();
    });

    it('should throw error for invalid metadata', () => {
      const props = createMockProps(mockSchema, {
        message: {
          text: 'Invalid metadata',
          results: [
            { text: 'Result', metadata: ['invalid'] }
          ]
        }
      });

      expect(() => {
        render(<Message {...props} />);
      }).toThrow();
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('should handle empty results array', () => {
      const props = createMockProps(mockSchema, {
        message: {
          text: 'No results',
          results: []
        }
      });

      const { container } = render(<Message {...props} />);
      expect(container.querySelector('.space-y-2')).toBeNull();
    });

    it('should handle null metadata', () => {
      const props = createMockProps(mockSchema, {
        message: {
          text: 'No metadata',
          results: [
            { text: 'Result', metadata: null }
          ]
        }
      });

      render(<Message {...props} />);
      expect(screen.getByText('Result')).toBeInTheDocument();
    });

    it('should handle long text content', () => {
      const longText = 'a'.repeat(1000);
      const props = createMockProps(mockSchema, {
        message: {
          text: longText
        }
      });

      const { container } = render(<Message {...props} />);
      expect(container.firstChild).toHaveClass('max-w-3xl');
    });
  });

  // Performance tests
  describe('Performance', () => {
    it('should memoize message classes correctly', () => {
      const props = createMockProps(mockSchema, {
        message: {
          text: 'Test',
          isUser: true
        }
      });

      const { rerender } = render(<Message {...props} />);
      const firstRender = screen.getByText('Test').parentElement.className;

      rerender(<Message {...props} />);
      const secondRender = screen.getByText('Test').parentElement.className;

      expect(firstRender).toBe(secondRender);
    });
  });
}); 