import { useState } from 'react';
import { ragService } from '../services/rag';

export function useRag() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryDocuments = async (query: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ragService.query(query);
      return response.response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to query documents');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const ingestDocument = async (text: string, metadata: Record<string, any>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ragService.ingestDocument({ text, metadata });
      return response.chunks;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ingest document');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    queryDocuments,
    ingestDocument,
    isLoading,
    error,
  };
} 