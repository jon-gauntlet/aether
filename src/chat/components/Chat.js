import React from 'react';
import { Message } from './Message';
import { Input } from './Input';
import { useChat } from '../hooks/useChat';

export function Chat() {
  const { 
    messages,
    isLoading,
    error,
    sendMessage,
    metrics
  } = useChat();

  const messagesEndRef = React.useRef(null);

  // Scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle message submission
  const handleSubmit = React.useCallback(async (text) => {
    if (!text.trim()) return;
    await sendMessage(text);
  }, [sendMessage]);

  // Empty state message
  const emptyStateMessage = React.useMemo(() => (
    <div className="text-center text-gray-500 mt-8">
      Start a conversation by typing a message below
    </div>
  ), []);

  return (
    <div className="flex flex-col h-screen">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          emptyStateMessage
        ) : (
          messages.map(message => (
            <Message 
              key={message.id} 
              message={message}
              isLoading={isLoading && message.isUser && message.id === messages[messages.length - 1]?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 text-red-500 bg-red-50">
          {error}
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t">
        <Input 
          onSubmit={handleSubmit}
          isLoading={isLoading}
          disabled={isLoading}
          placeholder="Type a message..."
        />
      </div>
    </div>
  );
}

Chat.displayName = 'Chat'; 