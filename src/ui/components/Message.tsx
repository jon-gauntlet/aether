import React from 'react';

interface SearchResult {
  text: string;
  score: number;
  metadata?: Record<string, any>;
}

interface MessageProps {
  message: {
    text: string;
    isUser: boolean;
    results?: SearchResult[];
  };
}

export const Message: React.FC<MessageProps> = ({ message }) => {
  const { text, isUser, results } = message;
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-3xl rounded-lg p-3 ${
        isUser ? 'bg-blue-500 text-white' : 'bg-gray-100'
      }`}>
        <p>{text}</p>
        
        {/* Show search results if available */}
        {results && (
          <div className="mt-2 space-y-2">
            {results.map((result, index) => (
              <div key={index} className="bg-white rounded p-2 shadow-sm">
                <p className="text-sm">{result.text}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Score: {result.score.toFixed(2)}
                </p>
                {result.metadata && (
                  <p className="text-xs text-gray-500">
                    {Object.entries(result.metadata).map(([key, value]) => (
                      <span key={key} className="mr-2">
                        {key}: {value}
                      </span>
                    ))}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 