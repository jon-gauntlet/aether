// Use relative URLs to leverage the Vite proxy
const API_BASE = '/api';

export async function queryRAG(text) {
  const response = await fetch(`${API_BASE}/rag/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: text }),
  });

  if (!response.ok) {
    throw new Error('Failed to query RAG system');
  }

  return response.json();
}

export async function ingestText(text, metadata = {}) {
  const response = await fetch(`${API_BASE}/rag/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, metadata }),
  });

  if (!response.ok) {
    throw new Error('Failed to ingest text into RAG system');
  }

  return response.json();
} 