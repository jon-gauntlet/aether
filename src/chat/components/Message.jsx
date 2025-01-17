import React from 'react';

export function Message({ message, isLoading }) {
  const { text, isUser, timestamp, metrics } = message;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`
        max-w-[70%] rounded-lg p-3
        ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-100'}
      `}>
        {/* Message text */}
        <div className="text-sm">{text}</div>

        {/* Timestamp */}
        <div className={`
          text-xs mt-1
          ${isUser ? 'text-blue-100' : 'text-gray-500'}
        `}>
          {new Date(timestamp).toLocaleTimeString()}
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="text-xs mt-1 text-gray-500">
            Sending...
          </div>
        )}

        {/* Metrics */}
        {metrics && (
          <div className="text-xs mt-1 text-gray-500">
            Latency: {metrics.latency}ms
          </div>
        )}
      </div>
    </div>
  );
}

Message.displayName = 'Message'; 