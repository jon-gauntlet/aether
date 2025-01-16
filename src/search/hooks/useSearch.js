import React from 'react';
import * as searchApi from '../api/search';

// Natural flow: query → results → display
export function useSearch() {
  const [results, setResults] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [metrics, setMetrics] = React.useState(null);

  const search = React.useCallback(async (query) => {
    if (!query.trim()) return;
    setError(null);
    setIsLoading(true);

    try {
      const response = await searchApi.search(query);
      setResults(response.results);
      setMetrics(response.metrics);
      return response.results;
    } catch (err) {
      setError(err.message || 'Search failed');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    results,
    isLoading,
    error,
    search,
    metrics
  };
} 