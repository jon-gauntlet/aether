interface Document {
  text: string;
  metadata: Record<string, any>;
}

interface QueryResponse {
  response: string;
}

const RAG_API_URL = 'http://localhost:8000';

export const ragService = {
  async ingestDocument(document: Document): Promise<{ chunks: number }> {
    const response = await fetch(`${RAG_API_URL}/ingest`, {
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

  async query(query: string): Promise<QueryResponse> {
    const response = await fetch(`${RAG_API_URL}/query`, {
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