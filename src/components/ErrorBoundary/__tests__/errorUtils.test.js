import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  ErrorTypes,
  ErrorSeverity,
  formatError,
  getErrorType,
  getErrorSeverity,
  isRecoverableError,
  getUserFriendlyMessage,
  getRecoveryInstructions,
  logError
} from '../errorUtils';

describe('Error Utilities', () => {
  describe('getErrorType', () => {
    it('identifies network errors', () => {
      const networkError = new Error('network connection failed');
      networkError.name = 'NetworkError';
      expect(getErrorType(networkError)).toBe(ErrorTypes.NETWORK);
    });

    it('identifies websocket errors', () => {
      const wsError = new Error('WebSocket connection failed');
      expect(getErrorType(wsError)).toBe(ErrorTypes.WEBSOCKET);
    });

    it('identifies chat errors', () => {
      const chatError = new Error('Failed to send chat message');
      expect(getErrorType(chatError)).toBe(ErrorTypes.CHAT);
    });

    it('identifies auth errors', () => {
      const authError = new Error('unauthorized access');
      expect(getErrorType(authError)).toBe(ErrorTypes.AUTH);
    });

    it('identifies validation errors', () => {
      const validationError = new Error('invalid input');
      validationError.name = 'ValidationError';
      expect(getErrorType(validationError)).toBe(ErrorTypes.VALIDATION);
    });

    it('returns unknown for unrecognized errors', () => {
      const unknownError = new Error('something went wrong');
      expect(getErrorType(unknownError)).toBe(ErrorTypes.UNKNOWN);
    });
  });

  describe('getErrorSeverity', () => {
    it('assigns high severity to network errors', () => {
      const networkError = new Error('network error');
      networkError.name = 'NetworkError';
      expect(getErrorSeverity(networkError)).toBe(ErrorSeverity.HIGH);
    });

    it('assigns critical severity to auth errors', () => {
      const authError = new Error('unauthorized access');
      expect(getErrorSeverity(authError)).toBe(ErrorSeverity.CRITICAL);
    });

    it('assigns medium severity to chat errors', () => {
      const chatError = new Error('chat message failed');
      expect(getErrorSeverity(chatError)).toBe(ErrorSeverity.MEDIUM);
    });

    it('assigns low severity to validation errors', () => {
      const validationError = new Error('invalid input');
      validationError.name = 'ValidationError';
      expect(getErrorSeverity(validationError)).toBe(ErrorSeverity.LOW);
    });
  });

  describe('isRecoverableError', () => {
    it('marks network errors as recoverable', () => {
      const networkError = new Error('network error');
      networkError.name = 'NetworkError';
      expect(isRecoverableError(networkError)).toBe(true);
    });

    it('marks auth errors as non-recoverable', () => {
      const authError = new Error('unauthorized access');
      expect(isRecoverableError(authError)).toBe(false);
    });

    it('marks chat errors as recoverable', () => {
      const chatError = new Error('chat message failed');
      expect(isRecoverableError(chatError)).toBe(true);
    });

    it('marks unknown errors as non-recoverable', () => {
      const unknownError = new Error('something went wrong');
      expect(isRecoverableError(unknownError)).toBe(false);
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('returns network-specific message', () => {
      const networkError = new Error('network error');
      networkError.name = 'NetworkError';
      expect(getUserFriendlyMessage(networkError)).toContain('internet connection');
    });

    it('returns websocket-specific message', () => {
      const wsError = new Error('WebSocket connection failed');
      expect(getUserFriendlyMessage(wsError)).toContain('Lost connection');
    });

    it('returns chat-specific message', () => {
      const chatError = new Error('chat message failed');
      expect(getUserFriendlyMessage(chatError)).toContain('Failed to send');
    });

    it('returns auth-specific message', () => {
      const authError = new Error('unauthorized');
      expect(getUserFriendlyMessage(authError)).toContain('session has expired');
    });

    it('returns validation-specific message', () => {
      const validationError = new Error('invalid email');
      validationError.name = 'ValidationError';
      expect(getUserFriendlyMessage(validationError)).toContain('invalid email');
    });

    it('returns generic message for unknown errors', () => {
      const unknownError = new Error('something went wrong');
      expect(getUserFriendlyMessage(unknownError)).toContain('unexpected error');
    });
  });

  describe('getRecoveryInstructions', () => {
    it('returns network recovery instructions', () => {
      const networkError = new Error('network error');
      networkError.name = 'NetworkError';
      expect(getRecoveryInstructions(networkError)).toContain('internet connection');
    });

    it('returns websocket recovery instructions', () => {
      const wsError = new Error('WebSocket connection failed');
      expect(getRecoveryInstructions(wsError)).toContain('reconnect');
    });

    it('returns chat recovery instructions', () => {
      const chatError = new Error('chat message failed');
      expect(getRecoveryInstructions(chatError)).toContain('Try Again');
    });

    it('returns auth recovery instructions', () => {
      const authError = new Error('unauthorized');
      expect(getRecoveryInstructions(authError)).toContain('Sign In');
    });

    it('returns validation recovery instructions', () => {
      const validationError = new Error('invalid input');
      validationError.name = 'ValidationError';
      expect(getRecoveryInstructions(validationError)).toContain('highlighted fields');
    });
  });

  describe('formatError', () => {
    it('formats error with all required fields', () => {
      const error = new Error('test error');
      const context = { userId: '123' };
      const formatted = formatError(error, context);

      expect(formatted).toEqual(expect.objectContaining({
        type: expect.any(String),
        severity: expect.any(String),
        name: error.name,
        message: error.message,
        stack: error.stack,
        timestamp: expect.any(String),
        userId: '123'
      }));
    });

    it('includes additional context', () => {
      const error = new Error('test error');
      const context = { component: 'Chat', action: 'send' };
      const formatted = formatError(error, context);

      expect(formatted.component).toBe('Chat');
      expect(formatted.action).toBe('send');
    });
  });

  describe('logError', () => {
    const originalConsoleError = console.error;
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
      console.error = vi.fn();
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      console.error = originalConsoleError;
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('logs formatted error in development', () => {
      const error = new Error('test error');
      const context = { userId: '123' };
      
      logError(error, context);
      
      expect(console.error).toHaveBeenCalledWith(
        'Error:',
        expect.objectContaining({
          type: expect.any(String),
          severity: expect.any(String),
          userId: '123'
        })
      );
    });

    it('does not log in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('test error');
      
      logError(error);
      
      expect(console.error).not.toHaveBeenCalled();
    });
  });
}); 