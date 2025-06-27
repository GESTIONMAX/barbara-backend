import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth';
import { registerSchema, loginSchema } from '../schemas/authSchemas';

// Inscription
export const register = async (req: Request, res: Response) => {
  try {
    console.log('🔍 Début register');
    console.log('🔍 Body reçu:', req.body);

    // Validation déjà faite par le middleware validateBody
    const { email, password, name } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({ 
      where: { email } 
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cet email est déjà utilisé' 
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'user' // Par défaut
      }
    });

    console.log('✅ Utilisateur créé:', { id: newUser.id, email: newUser.email });

    // Générer le token
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role
    });

    return res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });

  } catch (error) {
    console.error('🚨 ERREUR register:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'inscription'
    });
  }
};

// Connexion
export const login = async (req: Request, res: Response) => {
  try {
    console.log('�� Début login');
    console.log('🔍 Body reçu:', req.body);

    // Validation déjà faite par le middleware validateBody
    const { email, password } = req.body;

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({ 
      where: { email } 
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Email ou mot de passe incorrect' 
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        error: 'Email ou mot de passe incorrect' 
      });
    }

    console.log('✅ Connexion réussie:', { id: user.id, email: user.email });

    // Générer le token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    return res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('🚨 ERREUR login:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la connexion'
    });
  }
};

// Profil utilisateur connecté
export const me = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Utilisateur non authentifié' 
      });
    }

    // Récupérer les infos complètes de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    return res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    console.error('🚨 ERREUR me:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

