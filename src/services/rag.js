const API_BASE_URL = process.env.NEXT_PUBLIC_VERCEL_URL 
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api` 
  : 'http://localhost:3000/api';

export const ragService = {
  async ingestDocument(document) {
    const response = await fetch(`${API_BASE_URL}/rag/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(document),
    });

    if (!response.ok) {
      throw new Error('Failed to ingest document');
    }

    return response.json();
  },

  async query(query) {
    const response = await fetch(`${API_BASE_URL}/rag/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error('Failed to query documents');
    }

    return response.json();
  },
}; 