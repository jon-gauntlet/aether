const http = require('http');
const WebSocket = require('ws');

// Create HTTP server for health checks
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
  } else {
    res.writeHead(404);
    res.end();
  }
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.on('message', (message) => {
    console.log('Received:', message.toString());
    // Echo back the message
    ws.send(message.toString());
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

const port = process.env.PORT || 8000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 