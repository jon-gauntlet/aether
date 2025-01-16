import React from 'react';
import PropTypes from 'prop-types';

const SearchResult = React.memo(({ result }) => (
  <div className="bg-white rounded p-3 shadow-sm">
    <p className="text-sm text-gray-800">{result.text}</p>
    {result.metadata && (
      <div className="mt-2 text-xs text-gray-500">
        {Object.entries(result.metadata).map(([key, value]) => (
          <span key={key} className="mr-3">
            <span className="font-medium">{key}:</span>{' '}
            <span>{String(value)}</span>
          </span>
        ))}
      </div>
    )}
    {result.score && (
      <div className="mt-1 text-xs text-gray-400">
        Relevance: {Math.round(result.score * 100)}%
      </div>
    )}
  </div>
));

const SearchMetrics = React.memo(({ metrics }) => (
  <div className="text-xs text-gray-400 mt-2">
    <span className="mr-3">
      Time: {metrics.latency_ms}ms
    </span>
    <span>
      Results: {metrics.result_count}
    </span>
  </div>
));

export const Message = React.memo(({ message, isLoading }) => {
  const messageClasses = React.useMemo(() => {
    return message.isUser
      ? 'bg-blue-100 ml-auto'
      : message.error
        ? 'bg-red-100 text-red-700'
        : 'bg-gray-100';
  }, [message.isUser, message.error]);

  return (
    <div className={`rounded-lg p-4 max-w-3xl ${messageClasses}`}>
      {isLoading ? (
        <div className="flex items-center text-gray-500">
          <span className="animate-pulse mr-2">●</span>
          Processing...
        </div>
      ) : (
        <>
          <p className="text-sm">{message.text}</p>
          
          {message.results && (
            <div className="mt-4 space-y-2">
              {message.results.map((result, index) => (
                <SearchResult 
                  key={`${message.id}-result-${index}`}
                  result={result}
                />
              ))}
            </div>
          )}
          
          {message.metrics && <SearchMetrics metrics={message.metrics} />}
          
          {message.timestamp && (
            <div className="text-xs text-gray-400 mt-2">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          )}
        </>
      )}
    </div>
  );
});

Message.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    isUser: PropTypes.bool,
    error: PropTypes.bool,
    results: PropTypes.arrayOf(PropTypes.shape({
      text: PropTypes.string.isRequired,
      metadata: PropTypes.object,
      score: PropTypes.number
    })),
    metrics: PropTypes.shape({
      latency_ms: PropTypes.number,
      result_count: PropTypes.number
    }),
    timestamp: PropTypes.string
  }).isRequired,
  isLoading: PropTypes.bool
};

SearchResult.propTypes = {
  result: PropTypes.shape({
    text: PropTypes.string.isRequired,
    metadata: PropTypes.object,
    score: PropTypes.number
  }).isRequired
};

SearchMetrics.propTypes = {
  metrics: PropTypes.shape({
    latency_ms: PropTypes.number.isRequired,
    result_count: PropTypes.number.isRequired
  }).isRequired
};

Message.displayName = 'Message';
SearchResult.displayName = 'SearchResult';
SearchMetrics.displayName = 'SearchMetrics'; 