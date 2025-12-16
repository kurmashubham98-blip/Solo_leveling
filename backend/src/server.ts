import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import playerRoutes from './routes/player';
import questRoutes from './routes/quests';
import dungeonRoutes from './routes/dungeons';
import inventoryRoutes from './routes/inventory';
import achievementRoutes from './routes/achievements';
import statisticsRoutes from './routes/statistics';

// Import middleware and socket
import { authMiddleware } from './middleware/auth';
import { initializeSocket } from './socket/socketHandler';

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/player', authMiddleware, playerRoutes);
app.use('/api/quests', authMiddleware, questRoutes);
app.use('/api/dungeons', authMiddleware, dungeonRoutes);
app.use('/api/inventory', authMiddleware, inventoryRoutes);
app.use('/api/achievements', authMiddleware, achievementRoutes);
app.use('/api/statistics', authMiddleware, statisticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize Socket.io
initializeSocket(io);

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(Server running on port );
  console.log(Environment: );
});

export default app;
