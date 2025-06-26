#!/bin/bash

# 🏗️ Script de restructuration Barbara Backend
echo "🏗️ Restructuration du projet Barbara Backend..."

# 1. Créer les nouveaux dossiers
echo "📁 Création de la structure de dossiers..."
mkdir -p src/controllers
mkdir -p src/middleware
mkdir -p src/services
mkdir -p src/types
mkdir -p src/utils
mkdir -p src/config
mkdir -p tests
mkdir -p dist

# 2. Renommer index.ts en app.ts et le déplacer
echo "📝 Déplacement du fichier principal..."
mv src/index.ts src/app.ts

# 3. Créer le nouveau point d'entrée
echo "🚀 Création du nouveau point d'entrée..."
cat > src/index.ts << 'EOF'
import app from './app';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Barbara Backend démarré sur le port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
EOF

# 4. Déplacer et renommer le contrôleur des packs
echo "🎯 Création du contrôleur des packs..."
cat > src/controllers/packController.ts << 'EOF'
import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export const getAllPacks = async (req: Request, res: Response) => {
  try {
    const { category, active = 'true' } = req.query;
    
    const packs = await prisma.pack.findMany({
      where: {
        ...(category && { category: category as string }),
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      success: true,
      data: packs,
      count: packs.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des packs:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des packs'
    });
  }
};

export const getPackById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const pack = await prisma.pack.findUnique({
      where: { id }
    });
    
    if (!pack) {
      return res.status(404).json({
        success: false,
        error: 'Pack non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: pack
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du pack:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération du pack'
    });
  }
};

export const createPack = async (req: Request, res: Response) => {
  try {
    const packData = req.body;
    
    const newPack = await prisma.pack.create({
      data: packData
    });
    
    res.status(201).json({
      success: true,
      data: newPack,
      message: 'Pack créé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la création du pack:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la création du pack'
    });
  }
};

export const updatePack = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const existingPack = await prisma.pack.findUnique({
      where: { id }
    });
    
    if (!existingPack) {
      return res.status(404).json({
        success: false,
        error: 'Pack non trouvé'
      });
    }
    
    const updatedPack = await prisma.pack.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });
    
    res.json({
      success: true,
      data: updatedPack,
      message: 'Pack mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du pack:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour du pack'
    });
  }
};

export const deletePack = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const existingPack = await prisma.pack.findUnique({
      where: { id }
    });
    
    if (!existingPack) {
      return res.status(404).json({
        success: false,
        error: 'Pack non trouvé'
      });
    }
    
    await prisma.pack.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: 'Pack supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du pack:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la suppression du pack'
    });
  }
};
EOF

# 5. Créer la nouvelle route des packs
echo "🛣️ Mise à jour des routes..."
cat > src/routes/packRoutes.ts << 'EOF'
import { Router } from 'express';
import {
  getAllPacks,
  getPackById,
  createPack,
  updatePack,
  deletePack
} from '../controllers/packController';

const router = Router();

// GET /api/packs - Récupérer tous les packs
router.get('/', getAllPacks);

// GET /api/packs/:id - Récupérer un pack par ID
router.get('/:id', getPackById);

// POST /api/packs - Créer un nouveau pack
router.post('/', createPack);

// PUT /api/packs/:id - Mettre à jour un pack
router.put('/:id', updatePack);

// DELETE /api/packs/:id - Supprimer un pack
router.delete('/:id', deletePack);

export default router;
EOF

# 6. Créer le fichier de configuration de la base de données
echo "🗄️ Configuration de la base de données..."
cat > src/config/database.ts << 'EOF'
import { PrismaClient } from '../../generated/prisma';

let prisma: PrismaClient;

declare global {
  var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  prisma = global.__prisma;
}

export default prisma;
EOF

# 7. Créer les middlewares de base
echo "🛡️ Création des middlewares..."
cat > src/middleware/errorHandler.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Erreur capturée:', error);
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Erreur serveur interne' 
      : error.message
  });
};

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} non trouvée`
  });
};
EOF

# 8. Créer les types personnalisés
echo "📝 Création des types..."
cat > src/types/api.ts << 'EOF'
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface PackQuery extends PaginationQuery {
  category?: string;
  active?: string;
}
EOF

# 9. Créer des utilitaires
echo "🔧 Création des utilitaires..."
cat > src/utils/validation.ts << 'EOF'
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '');
};
EOF

# 10. Mettre à jour app.ts
echo "⚙️ Mise à jour de app.ts..."
cat > src/app.ts << 'EOF'
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
EOF

# 11. Supprimer l'ancienne route
echo "🗑️ Nettoyage des anciens fichiers..."
rm src/routes/pack.ts

# 12. Créer un exemple de test
echo "🧪 Création d'un test exemple..."
cat > tests/pack.test.js << 'EOF'
// Exemple de test pour les packs
// À adapter selon votre framework de test préféré (Jest, Mocha, etc.)

const request = require('supertest');
// const app = require('../src/app').default;

describe('Pack API', () => {
  describe('GET /api/packs', () => {
    it('should return all packs', async () => {
      // Test à implémenter
      console.log('Test des packs à implémenter');
    });
  });

  describe('GET /api/packs/:id', () => {
    it('should return a specific pack', async () => {
      // Test à implémenter
      console.log('Test de récupération d\'un pack spécifique');
    });
  });
});
EOF

# 13. Mettre à jour package.json avec les nouveaux scripts
echo "📦 Mise à jour des scripts..."
npm pkg set scripts.dev="ts-node-dev --respawn --transpile-only src/index.ts"
npm pkg set scripts.start="node dist/index.js"
npm pkg set scripts.build="tsc"
npm pkg set scripts.test="echo \"Tests à implémenter\""

# 14. Créer un fichier .env.example si il n'existe pas
if [ ! -f .env.example ]; then
  echo "📄 Création du .env.example..."
  cat > .env.example << 'EOF'
# Base de données
DATABASE_URL="postgresql://username:password@localhost:5432/barbara_db"

# Serveur
PORT=3001
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:3000
EOF
fi

echo ""
echo "✅ Restructuration terminée avec succès !"
echo ""
echo "📁 Nouvelle structure :"
echo "├── src/"
echo "│   ├── controllers/     # Logique métier"
echo "│   ├── middleware/      # Middlewares"
echo "│   ├── routes/         # Routes API"
echo "│   ├── services/       # Services (à créer)"
echo "│   ├── types/          # Types TypeScript"
echo "│   ├── utils/          # Utilitaires"
echo "│   ├── config/         # Configuration"
echo "│   ├── app.ts          # Configuration Express"
echo "│   └── index.ts        # Point d'entrée"
echo "├── tests/              # Tests"
echo "└── dist/               # Build TypeScript"
echo ""
echo "🔄 Prochaines étapes :"
echo "1. Vérifiez les imports dans vos fichiers"
echo "2. Testez avec: npm run dev"
echo "3. Générez le client Prisma: npx prisma generate"
echo "4. Testez l'API: http://localhost:3001/health"
