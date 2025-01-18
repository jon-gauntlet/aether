const API_URL = 'http://localhost:8000';

// Error handling
class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'APIError';
  }
}

export const apiClient = {
  // Health check
  async checkHealth() {
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) throw new APIError('API is unavailable', response.status);
    return response.json();
  },

  // Add documents
  async addDocuments(documents) {
    const response = await fetch(`${API_URL}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(documents)
    });
    if (!response.ok) throw new APIError('Failed to add documents', response.status);
    return response.json();
  },

  // Search documents
  async search(query, topK = 3) {
    const response = await fetch(`${API_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: query, top_k: topK })
    });
    if (!response.ok) throw new APIError('Failed to search', response.status);
    return response.json();
  },

  // Process query (combines search with response generation)
  async processQuery(query) {
    try {
      const searchResult = await this.search(query);
      return {
        type: 'assistant',
        content: searchResult.answer,
        metadata: {
          context: searchResult.context,
          expanded_query: searchResult.expanded_query
        }
      };
    } catch (error) {
      throw new APIError('Failed to process query', 500, error);
    }
  },

  // Get chat history (simplified for demo)
  async getChatHistory() {
    return [];  // For demo, we'll maintain history in component state
  }
}; 