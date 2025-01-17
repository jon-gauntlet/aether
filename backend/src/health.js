const express = require('express');
const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    // Check Redis connection
    const redisClient = req.app.get('redis');
    await redisClient.ping();
    
    res.json({
      status: 'healthy',
      redis: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      redis: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 