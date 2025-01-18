import React, { memo } from 'react';
import { withErrorBoundary } from './ErrorBoundary';
import { logError } from './ErrorBoundary/errorUtils';

const TypingIndicatorComponent = ({ users = [] }) => {
  if (users.length === 0) return null;

  const formatTypingMessage = () => {
    try {
      if (users.length === 1) {
        return `${users[0].email} is typing...`;
      }
      if (users.length === 2) {
        return `${users[0].email} and ${users[1].email} are typing...`;
      }
      return `${users[0].email} and ${users.length - 1} others are typing...`;
    } catch (error) {
      logError(error, {
        component: 'TypingIndicator',
        action: 'formatTypingMessage',
        users
      });
      return 'Someone is typing...';
    }
  };

  return (
    <div className="flex items-center gap-2 text-gray-500 text-sm p-2 animate-fade-in">
      <div className="flex gap-1">
        <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{formatTypingMessage()}</span>
    </div>
  );
};

export default withErrorBoundary(memo(TypingIndicatorComponent), {
  onError: (error, errorInfo) => {
    logError(error, {
      component: 'TypingIndicator',
      ...errorInfo
    });
  }
}); 