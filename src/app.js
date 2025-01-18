import express from 'express';
import expressWs from 'express-ws';
import cors from 'cors';
import messagesRouter from './api/messages';

const app = express();
expressWs(app);

// Middleware
app.use(cors({
  origin: process.env.VITE_APP_URL || '*',
  methods: ['GET', 'POST', 'OPTIONS']
}));
app.use(express.json());

// API routes
app.use('/api/messages', messagesRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 