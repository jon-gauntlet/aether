import { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.body;

    // For MVP, we'll just use Claude to answer the query
    // In a full implementation, you would:
    // 1. Create embedding for the query
    // 2. Search vector database for relevant chunks
    // 3. Use chunks as context for Claude response

    const message = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: query
        }
      ],
    });

    return res.status(200).json({ 
      response: message.content[0].text
    });
  } catch (error) {
    console.error('RAG query error:', error);
    return res.status(500).json({ error: 'Failed to process query' });
  }
} 