import { rest } from 'msw'

const BASE_URL = process.env.VITE_API_URL || 'http://localhost:8000'

export const handlers = [
  // RAG Query endpoint
  rest.post(`${BASE_URL}/api/rag/query`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        answer: "This is a mock response from MSW",
        sources: [
          {
            text: "Mock source document",
            score: 0.95,
            metadata: { source: "test-doc-1" }
          }
        ]
      })
    )
  }),

  // Document upload endpoint
  rest.post(`${BASE_URL}/api/rag/documents`, async (req, res, ctx) => {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file) {
      return res(
        ctx.status(400),
        ctx.json({ error: 'No file provided' })
      )
    }

    return res(
      ctx.status(200),
      ctx.json({
        message: 'Document uploaded successfully',
        documentId: 'mock-doc-123'
      })
    )
  }),

  // Health check endpoint
  rest.get(`${BASE_URL}/health`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        status: 'healthy',
        version: '1.0.0',
        uptime: 123456
      })
    )
  }),

  // WebSocket connection (mock)
  rest.get(`${BASE_URL}/ws`, (req, res, ctx) => {
    return res(
      ctx.status(101), // Switching protocols
      ctx.set('Upgrade', 'websocket'),
      ctx.set('Connection', 'Upgrade')
    )
  })
] 