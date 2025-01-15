import { useState, useCallback } from 'react';
import { RAGService, QueryRequest, QueryResponse } from '../services/ragService';

interface UseRAGResult {
  query: (question: string, context?: Record<string, any>) => Promise<void>;
  ingestText: (text: string, metadata?: Record<string, any>) => Promise<void>;
  answer: QueryResponse | null;
  loading: boolean;
  error: Error | null;
}

export function useRAG(): UseRAGResult {
  const [answer, setAnswer] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const ragService = RAGService.getInstance();

  const query = useCallback(async (question: string, context?: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      const request: QueryRequest = { question, context };
      const response = await ragService.query(request);
      setAnswer(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }, []);

  const ingestText = useCallback(async (text: string, metadata?: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      await ragService.ingestText(text, metadata);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    query,
    ingestText,
    answer,
    loading,
    error,
  };
} 