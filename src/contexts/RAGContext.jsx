import React, { createContext, useContext, useState, useCallback } from 'react';

const RAGContext = createContext(null);

export function useRAG() {
  const context = useContext(RAGContext);
  if (!context) {
    throw new Error('useRAG must be used within a RAGProvider');
  }
  return context;
}

export function RAGProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const query = useCallback(async (text) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/rag/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: text }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to query RAG system');
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const ingestText = useCallback(async (text, metadata = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/rag/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, metadata }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to ingest text into RAG system');
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = {
    query,
    ingestText,
    isLoading,
    error,
  };

  return (
    <RAGContext.Provider value={value}>
      {children}
    </RAGContext.Provider>
  );
} 