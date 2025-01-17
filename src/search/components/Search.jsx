import React from 'react';
import { useSearch } from '../hooks/useSearch';

function SearchResult({ result }) {
  return (
    <div className="p-3 border rounded-lg">
      <div className="text-sm">{result.text}</div>
      <div className="text-xs text-gray-500 mt-1">
        Score: {result.score.toFixed(2)}
      </div>
    </div>
  );
}

export function Search() {
  const { 
    results,
    isLoading,
    error,
    search,
    metrics
  } = useSearch();

  const [query, setQuery] = React.useState('');

  const handleSubmit = React.useCallback(async (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    await search(query);
  }, [query, isLoading, search]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Search form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            disabled={isLoading}
            className="flex-1 p-2 border rounded-lg"
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className={`
              px-4 py-2 rounded-lg text-white
              ${(!query.trim() || isLoading) 
                ? 'bg-gray-400' 
                : 'bg-blue-500 hover:bg-blue-600'}
            `}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Error display */}
      {error && (
        <div className="p-4 mb-4 text-red-500 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      {/* Results */}
      <div className="space-y-4">
        {results.map(result => (
          <SearchResult key={result.id} result={result} />
        ))}
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="mt-4 text-xs text-gray-500">
          Search completed in {metrics.latency}ms
        </div>
      )}
    </div>
  );
}

Search.displayName = 'Search'; 