import { useState } from 'react';

interface SearchResult {
  text: string;
  score: number;
  metadata?: Record<string, any>;
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
}

export const useRag = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: string): Promise<SearchResult[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: query,
          top_k: 3
        }),
      });
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data: SearchResponse = await response.json();
      return data.results;
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      throw err;
      
    } finally {
      setIsLoading(false);
    }
  };

  const addDocuments = async (texts: string[], metadata?: Record<string, any>[]) => {
    try {
      const documents = texts.map((text, i) => ({
        text,
        metadata: metadata?.[i]
      }));
      
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documents),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add documents');
      }
      
      return response.json();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add documents');
      throw err;
    }
  };

  return {
    search,
    addDocuments,
    isLoading,
    error
  };
}; 