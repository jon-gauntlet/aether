export default async function handler(req, res) {
  console.log('Test endpoint hit')
  return res.status(200).json({ 
    message: 'RAG API is working',
    timestamp: new Date().toISOString()
  });
} 