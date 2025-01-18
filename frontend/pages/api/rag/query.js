import { RAGSystem } from '../../../rag_aether/ai/rag_system';
import { performance } from 'perf_hooks';

// Initialize RAG system
const ragSystem = new RAGSystem({
  useCache: true,
  maxResults: 5,
  minConfidence: 0.7
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = performance.now();

  try {
    const { query, maxResults = 5 } = req.body;

    // Validate query
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Invalid query' });
    }

    // Search using RAG system
    const results = await ragSystem.search(query, maxResults);

    // Format response
    const response = {
      results: results.map(doc => ({
        text: doc.text,
        metadata: doc.metadata,
        score: doc.metadata.search_score
      })),
      metrics: {
        latency_ms: Math.round(performance.now() - startTime),
        result_count: results.length
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('RAG query error:', error);
    return res.status(500).json({ 
      error: 'Failed to process query',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 