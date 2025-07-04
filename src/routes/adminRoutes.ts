import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Endpoint temporaire pour réinitialiser le mot de passe administrateur
 * ATTENTION: À SUPPRIMER APRÈS UTILISATION
 */
router.post('/reset-admin-password', async (req: Request, res: Response) => {
  try {
    // Code secret pour protéger l'endpoint (à remplacer par un token réel en production)
    const secretKey = 'barbara2025-temporary-key';
    
    if (req.body.secretKey !== secretKey) {
      return res.status(401).json({ 
        success: false, 
        message: 'Non autorisé' 
      });
    }
    
    const email = 'adv@barbaradecors.fr';
    const newPassword = 'Barbara2025!';
    
    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Mettre à jour l'utilisateur
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Aucun utilisateur trouvé avec l'email: ${email}`
      });
    }
    
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
    
    return res.status(200).json({
      success: true,
      message: `Mot de passe réinitialisé pour ${email}`,
      newPassword: newPassword,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Erreur de réinitialisation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la réinitialisation du mot de passe',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
