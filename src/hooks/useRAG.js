import { useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const useRAG = () => {
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const query = async (question) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: question,
          k: 5,
          threshold: 0.5,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get answer');
      }

      const results = await response.json();
      setAnswer({
        answer: results[0]?.text || 'No relevant answer found',
        sources: results.map(result => ({
          content: result.text,
          metadata: result.metadata,
          similarity: result.similarity,
        })),
      });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const ingestText = async (text) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add document');
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    query,
    ingestText,
    answer,
    loading,
    error,
  };
}; 