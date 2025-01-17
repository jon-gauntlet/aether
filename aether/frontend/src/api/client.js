import { supabase, storage, messages } from '../lib/supabase';

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
    const { data, error } = await supabase.from('health').select('status').single();
    if (error) throw new APIError('API is unavailable', 503);
    return data;
  },

  // Upload document
  async uploadDocument(file) {
    try {
      const data = await storage.uploadFile(file);
      const url = await storage.getFileUrl(data.path);
      
      await messages.create({
        content: 'Uploaded document',
        sender: 'system',
        metadata: {
          type: 'document',
          url,
          filename: file.name,
          size: file.size
        }
      });

      return { url, path: data.path };
    } catch (error) {
      throw new APIError('Failed to upload document', 500, error);
    }
  },

  // Process query
  async processQuery(query) {
    try {
      const message = await messages.create({
        content: query,
        sender: 'user'
      });

      // TODO: Add AI processing here
      const response = await messages.create({
        content: 'This is a mock response',
        sender: 'assistant',
        metadata: {
          query_id: message.id
        }
      });

      return response;
    } catch (error) {
      throw new APIError('Failed to process query', 500, error);
    }
  },

  // Get chat history
  async getChatHistory() {
    try {
      const data = await messages.list();
      return data;
    } catch (error) {
      throw new APIError('Failed to get chat history', 500, error);
    }
  },

  // Upload file
  async uploadFile(file) {
    return this.uploadDocument(file);
  }
}; 