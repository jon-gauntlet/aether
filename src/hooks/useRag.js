import { useState, useCallback } from 'react';

export const useRag = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);

  /**
   * Search for relevant documents
   * @param {string} query - The search query
   * @param {Object} options - Search options
   * @param {number} [options.maxResults=5] - Maximum number of results to return
   * @returns {Promise<Array>} Array of search results
   */
  const search = useCallback(async (query, { maxResults = 5 } = {}) => {
    setIsLoading(true);
    setError(null);
    setMetrics(null);
    
    try {
      const response = await fetch('/api/rag/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          maxResults
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Search failed');
      }
      
      const data = await response.json();
      setMetrics(data.metrics);
      
      return data.results;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      throw new Error(errorMessage);
      
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Add documents to the search index
   * @param {Array<{text: string, metadata?: Object}>} documents - Array of documents to add
   * @returns {Promise<Object>} Response from the server
   */
  const addDocuments = useCallback(async (documents) => {
    try {
      const response = await fetch('/api/rag/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documents }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to add documents');
      }
      
      return response.json();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add documents';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  return {
    search,
    addDocuments,
    isLoading,
    error,
    metrics
  };
}; 