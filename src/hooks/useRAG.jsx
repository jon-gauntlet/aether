import { useCallback, useState } from 'react';
import { queryRAG, ingestText } from '../services/rag';

/**
 * @typedef {Object} UseRAGResult
 * @property {function(string, Object=): Promise<void>} query - Function to query the RAG system with a question and optional context
 * @property {function(string, Object=): Promise<void>} ingestText - Function to add text to the RAG system with optional metadata
 * @property {Object|null} answer - The current answer from the RAG system, containing the answer text and sources
 * @property {boolean} loading - Whether a request is currently in progress
 * @property {Error|null} error - Any error that occurred during the last operation
 */

/**
 * A React hook for interacting with the RAG (Retrieval-Augmented Generation) system.
 * This hook provides functionality to query the RAG system with questions and ingest new text.
 * 
 * @example
 * ```jsx
 * function MyComponent() {
 *   const { query, ingestText, answer, loading, error } = useRAG();
 * 
 *   const handleQuestion = async (question) => {
 *     try {
 *       await query(question);
 *       // Handle successful query
 *     } catch (error) {
 *       // Handle error
 *     }
 *   };
 * 
 *   const handleIngest = async (text, metadata) => {
 *     try {
 *       await ingestText(text, metadata);
 *       // Handle successful ingestion
 *     } catch (error) {
 *       // Handle error
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       {loading && <LoadingSpinner />}
 *       {error && <ErrorMessage error={error} />}
 *       {answer && <Answer data={answer} />}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @returns {UseRAGResult} The RAG hook interface containing query and ingestion functions, along with state
 */
export function useRAG() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const query = useCallback(async (text) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await queryRAG(text);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const ingest = useCallback(async (text, metadata) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await ingestText(text, metadata);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    query,
    ingestText: ingest,
    isLoading,
    error,
  };
} 