import React, { useState } from 'react';
import { Message } from './Message';
import { Input } from './Input';
import { useRag } from '../hooks/useRag';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  results?: Array<{
    text: string;
    score: number;
    metadata?: Record<string, any>;
  }>;
}

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { search, isLoading } = useRag();

  const handleSubmit = async (text: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      isUser: true
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Get search results
      const results = await search(text);
      
      // Add response message
      const responseMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Here are the most relevant results:",
        isUser: false,
        results: results
      };
      setMessages(prev => [...prev, responseMessage]);
      
    } catch (error) {
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, something went wrong. Please try again.",
        isUser: false
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <Message key={message.id} message={message} />
        ))}
      </div>
      <div className="p-4 border-t">
        <Input onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}; 