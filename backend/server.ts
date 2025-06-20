import 'dotenv/config';
import express, { Request, Response, ErrorRequestHandler } from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';

import chatRoutes from './routes/chat';
import { setupWebSocketHandlers } from './websocket/chatHandler';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket setup
setupWebSocketHandlers(wss);

// Error handling middleware
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`WebSocket server ready for connections`);
});