import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

console.log('📋 Démarrage de Barbara Backend...');
console.log('🔧 Chargement de la configuration...');

// Configuration
dotenv.config();

// Afficher quelques informations de configuration (sans données sensibles)
console.log(`📌 NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`📌 FRONTEND_URL: ${process.env.FRONTEND_URL}`);
console.log(`📌 DATABASE_URL: ${process.env.DATABASE_URL ? '***configured***' : '***missing***'}`);
console.log(`📌 JWT_SECRET: ${process.env.JWT_SECRET ? '***configured***' : '***missing***'}`);

// Gestion globale des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('❌ ERREUR NON CAPTURÉE:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ PROMESSE REJETÉE NON GÉRÉE:', { reason, promise });
});

// Routes
import packRoutes from './routes/packRoutes';
import authRoutes from './routes/authRoutes';

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
      auth: '/api/auth',
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
app.use('/api/auth', authRoutes);
app.use('/api/packs', packRoutes);

// Middleware d'erreur (à la fin)
app.use(notFound);
app.use(errorHandler);

export default app;
