import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Configuration
dotenv.config();

// Routes
import packRoutes from './routes/packRoutes';

// Middleware
import { errorHandler, notFound } from './middleware/errorHandler';

const app = express();

// CORS configuré pour Barbara Décors
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes de base
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenue sur l\'API Barbara Décor 🎉',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      packs: '/api/packs'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'Barbara Backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes API
app.use('/api/packs', packRoutes);

// Middleware d'erreur (à la fin)
app.use(notFound);
app.use(errorHandler);

export default app;
