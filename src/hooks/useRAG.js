import { useState, useCallback, useRef } from 'react';
import { RAGService } from '../services/rag';

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
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Use ref for service instance to prevent re-creation
  const ragService = useRef(RAGService.getInstance());

  // Debounce and cache query results
  const queryCache = useRef(new Map());
  const queryTimeoutRef = useRef(null);

  const query = useCallback(async (question, context) => {
    if (!question.trim()) return;

    // Clear previous timeout
    if (queryTimeoutRef.current) {
      clearTimeout(queryTimeoutRef.current);
    }

    // Check cache
    const cacheKey = JSON.stringify({ question, context });
    if (queryCache.current.has(cacheKey)) {
      setAnswer(queryCache.current.get(cacheKey));
      return;
    }

    setLoading(true);
    setError(null);

    // Debounce query
    queryTimeoutRef.current = setTimeout(async () => {
      try {
        const request = { question, context };
        const response = await ragService.current.query(request);
        
        // Cache result
        queryCache.current.set(cacheKey, response);
        if (queryCache.current.size > 100) {
          // Limit cache size
          const firstKey = queryCache.current.keys().next().value;
          queryCache.current.delete(firstKey);
        }
        
        setAnswer(response);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce
  }, []);

  const ingestText = useCallback(async (text, metadata) => {
    if (!text.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await ragService.current.ingestText(text, metadata);
      // Clear cache after ingestion as it might affect future queries
      queryCache.current.clear();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    query,
    ingestText,
    answer,
    loading,
    error,
  };
} 