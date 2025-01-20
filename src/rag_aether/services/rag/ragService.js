import { AxiosError } from 'axios';
import { api } from '../chat';
import { RAGError } from '../../utils/errors';

/**
 * @typedef {Object} QueryRequest
 * @property {string} question - The question to ask the RAG system
 * @property {Object} [context] - Optional context to help guide the answer
 */

/**
 * @typedef {Object} Source
 * @property {string} content - The content of the source document
 * @property {Object} metadata - Metadata about the source, such as title, date, etc.
 */

/**
 * @typedef {Object} QueryResponse
 * @property {string} answer - The generated answer from the RAG system
 * @property {Source[]} sources - Array of sources used to generate the answer
 */

/**
 * @typedef {Object} HealthStatus
 * @property {string} status - The current health status of the system
 * @property {Object} [details] - Optional detailed health information
 */

/**
 * Service class for interacting with the RAG (Retrieval-Augmented Generation) system.
 * This class follows the singleton pattern to ensure only one instance exists.
 * 
 * @example
 * ```javascript
 * // Get the RAG service instance
 * const ragService = RAGService.getInstance();
 * 
 * // Query the system
 * try {
 *   const response = await ragService.query({
 *     question: 'What is RAG?',
 *     context: { domain: 'AI' }
 *   });
 *   console.log(response.answer);
 *   console.log(response.sources);
 * } catch (error) {
 *   if (error instanceof RAGError) {
 *     console.error('RAG Error:', error.message);
 *   }
 * }
 * 
 * // Ingest new text
 * try {
 *   await ragService.ingestText(
 *     'RAG is a hybrid approach combining retrieval and generation.',
 *     { source: 'documentation', date: '2024-01-01' }
 *   );
 * } catch (error) {
 *   console.error('Ingestion failed:', error);
 * }
 * ```
 */
export class RAGService {
  static #instance;
  #baseUrl;
  #requestQueue = [];
  #processingQueue = false;
  #maxConcurrentRequests = 3;
  #activeRequests = 0;
  #retryAttempts = 3;
  #retryDelay = 1000;

  constructor() {
    this.#baseUrl = process.env.NEXT_PUBLIC_RAG_API_URL || 'http://localhost:8000';
  }

  /**
   * Gets the singleton instance of RAGService.
   * Creates a new instance if one doesn't exist.
   * 
   * @returns {RAGService} The singleton RAGService instance
   */
  static getInstance() {
    if (!RAGService.#instance) {
      RAGService.#instance = new RAGService();
    }
    return RAGService.#instance;
  }

  /**
   * Processes the request queue with rate limiting and retries
   * @private
   */
  async #processQueue() {
    if (this.#processingQueue || this.#requestQueue.length === 0) return;
    
    this.#processingQueue = true;
    
    while (this.#requestQueue.length > 0 && this.#activeRequests < this.#maxConcurrentRequests) {
      const { request, resolve, reject, retries } = this.#requestQueue.shift();
      this.#activeRequests++;
      
      try {
        const response = await request();
        resolve(response);
      } catch (error) {
        if (retries < this.#retryAttempts && this.#shouldRetry(error)) {
          // Add back to queue with increased retry count
          await new Promise(r => setTimeout(r, this.#retryDelay * (retries + 1)));
          this.#requestQueue.push({ request, resolve, reject, retries: retries + 1 });
        } else {
          reject(error);
        }
      } finally {
        this.#activeRequests--;
      }
    }
    
    this.#processingQueue = false;
    
    // Continue processing if there are more requests
    if (this.#requestQueue.length > 0) {
      this.#processQueue();
    }
  }

  /**
   * Determines if a request should be retried
   * @private
   */
  #shouldRetry(error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      // Retry on network errors or 5xx server errors
      return !status || status >= 500;
    }
    return false;
  }

  /**
   * Adds a request to the queue
   * @private
   */
  #enqueueRequest(request) {
    return new Promise((resolve, reject) => {
      this.#requestQueue.push({ request, resolve, reject, retries: 0 });
      this.#processQueue();
    });
  }

  /**
   * Queries the RAG system with a question and optional context.
   * 
   * @param {QueryRequest} request - The query request containing the question and optional context
   * @returns {Promise<QueryResponse>} A promise that resolves to the query response
   * @throws {RAGError} If the query fails or the system is unavailable
   * 
   * @example
   * ```javascript
   * const response = await ragService.query({
   *   question: 'What is RAG?',
   *   context: { domain: 'AI' }
   * });
   * console.log(response.answer);
   * ```
   */
  async query(request) {
    return this.#enqueueRequest(async () => {
      try {
        const response = await api.post(`${this.#baseUrl}/query`, request);
        return response.data;
      } catch (error) {
        if (error instanceof AxiosError) {
          throw new RAGError(`Query failed: ${error.response?.data?.detail || error.message}`, 'QUERY_ERROR');
        }
        throw new RAGError(error.message);
      }
    });
  }

  /**
   * Ingests text into the RAG system with optional metadata.
   * 
   * @param {string} text - The text to ingest into the system
   * @param {Object} [metadata] - Optional metadata about the text
   * @returns {Promise<void>} A promise that resolves when ingestion is complete
   * @throws {RAGError} If the ingestion fails or the system is unavailable
   * 
   * @example
   * ```javascript
   * await ragService.ingestText(
   *   'RAG combines retrieval and generation for better answers.',
   *   { source: 'documentation', date: '2024-01-01' }
   * );
   * ```
   */
  async ingestText(text, metadata) {
    return this.#enqueueRequest(async () => {
      try {
        await api.post(`${this.#baseUrl}/ingest`, { text, metadata });
      } catch (error) {
        if (error instanceof AxiosError) {
          throw new RAGError(`Text ingestion failed: ${error.response?.data?.detail || error.message}`, 'INGEST_ERROR');
        }
        throw new RAGError(error.message);
      }
    });
  }

  /**
   * Checks the health status of the RAG system.
   * 
   * @returns {Promise<HealthStatus>} A promise that resolves to the health status
   * @throws {RAGError} If the health check fails or the system is unavailable
   * 
   * @example
   * ```javascript
   * try {
   *   const health = await ragService.checkHealth();
   *   console.log('System status:', health.status);
   * } catch (error) {
   *   console.error('Health check failed:', error);
   * }
   * ```
   */
  async checkHealth() {
    return this.#enqueueRequest(async () => {
      try {
        const response = await api.get(`${this.#baseUrl}/health`);
        return response.data;
      } catch (error) {
        if (error instanceof AxiosError) {
          throw new RAGError(`Health check failed: ${error.response?.data?.detail || error.message}`, 'HEALTH_CHECK_ERROR');
        }
        throw new RAGError(error.message);
      }
    });
  }
} 