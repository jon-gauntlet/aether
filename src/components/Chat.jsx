import React, { useState, useEffect, useRef } from 'react';
import { useMessages } from '../hooks/useMessages';
import { useTypingStatus } from '../hooks/useTypingStatus';
import { ChatErrorBoundary } from './ErrorBoundary';
import Message from './Message';
import TypingIndicator from './TypingIndicator';
import { logError } from './ErrorBoundary/errorUtils';

const Chat = () => {
  const [inputValue, setInputValue] = useState('');
  const { messages, sendMessage, error: messageError, loading } = useMessages();
  const { typingUsers, broadcastTyping } = useTypingStatus();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    try {
      await sendMessage(inputValue);
      setInputValue('');
    } catch (error) {
      logError(error, {
        component: 'Chat',
        action: 'sendMessage',
        messageContent: inputValue
      });
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    broadcastTyping();
  };

  return (
    <ChatErrorBoundary>
      <div className="flex flex-col h-full">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4">
          {messageError && (
            <div className="bg-red-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-red-700">
                {messageError.message}
              </p>
            </div>
          )}
          
          {loading && (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          )}
          
          {messages.map((message) => (
            <Message
              key={message.id}
              message={message}
            />
          ))}
          
          {typingUsers.length > 0 && (
            <TypingIndicator users={typingUsers} />
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </ChatErrorBoundary>
  );
};

export default Chat; 