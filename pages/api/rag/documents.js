import { RAGSystem } from '../../../rag_aether/ai/rag_system';
import { performance } from 'perf_hooks';

// Use the same RAG system instance
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
    const { documents } = req.body;

    // Validate documents
    if (!Array.isArray(documents)) {
      return res.status(400).json({ error: 'Documents must be an array' });
    }

    if (documents.some(doc => !doc.text || typeof doc.text !== 'string')) {
      return res.status(400).json({ error: 'Each document must have a text field' });
    }

    // Add documents to RAG system
    const results = await ragSystem.addDocuments(documents);

    // Format response
    const response = {
      success: true,
      count: documents.length,
      metrics: {
        latency_ms: Math.round(performance.now() - startTime),
        documents_processed: documents.length
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Document ingestion error:', error);
    return res.status(500).json({ 
      error: 'Failed to process documents',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 