import { useState } from 'react';
import { ragService } from '../services/rag.js';

export function useRag() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const queryDocuments = async (query) => {
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

  const ingestDocument = async (text, metadata) => {
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