import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

// Étendre l'interface Request pour inclure user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: 'user' | 'admin';
      };
    }
  }
}

// Interface pour le payload JWT
interface JwtPayload {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

// Fonction pour générer un token JWT
export const generateToken = (user: { id: string; email: string; role: string }) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

// Middleware d'authentification JWT
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'accès requis'
      });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // Vérifier que l'utilisateur existe toujours
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Ajouter les infos utilisateur à la requête
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    next();

  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        error: 'Token invalide'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({
        success: false,
        error: 'Token expiré'
      });
    }

    console.error('Erreur middleware auth:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'authentification'
    });
  }
};

// Middleware pour vérifier le rôle admin
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentification requise'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Accès administrateur requis'
    });
  }

  next();
};

// Middleware pour vérifier que l'utilisateur accède à ses propres données
export const requireOwnershipOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentification requise'
    });
  }

  const targetUserId = req.params.userId || req.body.userId;

  // Admin peut accéder à tout
  if (req.user.role === 'admin') {
    return next();
  }

  // Utilisateur peut accéder à ses propres données
  if (req.user.id === targetUserId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Accès non autorisé'
  });
};

// Middleware optionnel (utilisateur connecté ou pas)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(); // Pas d'utilisateur connecté, continuer sans erreur
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    };
  } catch (error) {
    // Si le token est invalide, on ignore et passe la main
  }

  next();
};
