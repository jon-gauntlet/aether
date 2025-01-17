import React from 'react';
import * as chatApi from '../api/chat';

// Natural flow: state → action → update
export function useChat() {
  const [messages, setMessages] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [metrics, setMetrics] = React.useState(null);

  // Load initial messages
  React.useEffect(() => {
    chatApi.getMessages().then(msgs => {
      if (msgs?.length) setMessages(msgs);
    });
  }, []);

  // Send a message
  const sendMessage = React.useCallback(async (text) => {
    if (!text.trim()) return;
    setError(null);
    setIsLoading(true);

    try {
      // Add user message
      const userMessage = {
        id: Date.now().toString(),
        text,
        isUser: true,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);

      // Get response from API
      const response = await chatApi.sendMessage(text);

      // Add response message
      const responseMessage = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        isUser: false,
        timestamp: new Date().toISOString(),
        metrics: response.metrics
      };
      
      setMessages(prev => [...prev, responseMessage]);
      setMetrics(response.metrics);

    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    metrics
  };
} 