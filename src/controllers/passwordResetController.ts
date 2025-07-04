import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { emailService } from '../services/emailService';

/**
 * Demande de réinitialisation de mot de passe
 * - Génère un token unique
 * - Enregistre le token dans la base de données
 * - Envoie un email avec le lien de réinitialisation
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    console.log(`🔍 Demande de réinitialisation pour: ${email}`);

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({ where: { email } });

    // Pour des raisons de sécurité, nous ne révélons pas si l'email existe ou non
    if (!user) {
      console.log(`⚠️ Utilisateur non trouvé: ${email}`);
      return res.status(200).json({
        success: true,
        message: 'Si cet email est associé à un compte, vous recevrez un lien de réinitialisation'
      });
    }

    // Générer un token aléatoire et sécurisé
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Calculer une date d'expiration (30 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    // Supprimer tous les tokens existants pour cet utilisateur
    await prisma.passwordReset.deleteMany({
      where: { userId: user.id }
    });

    // Créer un nouveau token de réinitialisation
    await prisma.passwordReset.create({
      data: {
        token: resetToken,
        userId: user.id,
        expires: expiresAt
      }
    });

    // Envoyer l'email de réinitialisation
    const emailResult = await emailService.sendPasswordResetEmail(
      user.email, 
      resetToken, 
      user.name
    );

    if (!emailResult.success) {
      console.error('❌ Échec de l\'envoi de l\'email:', emailResult.error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email de réinitialisation'
      });
    }

    console.log(`✅ Email de réinitialisation envoyé à: ${email}`);
    return res.status(200).json({
      success: true,
      message: 'Email de réinitialisation envoyé'
    });

  } catch (error) {
    console.error('❌ Erreur forgotPassword:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la demande de réinitialisation'
    });
  }
};

/**
 * Validation du token et réinitialisation du mot de passe
 * - Vérifie que le token existe et est valide
 * - Met à jour le mot de passe de l'utilisateur
 * - Invalide le token utilisé
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    // Rechercher le token de réinitialisation
    const passwordReset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true }
    });

    // Vérifier si le token existe
    if (!passwordReset) {
      return res.status(400).json({
        success: false,
        message: 'Token de réinitialisation invalide'
      });
    }

    // Vérifier si le token a déjà été utilisé
    if (passwordReset.used) {
      return res.status(400).json({
        success: false,
        message: 'Ce lien de réinitialisation a déjà été utilisé'
      });
    }

    // Vérifier si le token a expiré
    if (new Date() > passwordReset.expires) {
      return res.status(400).json({
        success: false,
        message: 'Le lien de réinitialisation a expiré'
      });
    }

    // Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Mettre à jour le mot de passe de l'utilisateur
    await prisma.user.update({
      where: { id: passwordReset.userId },
      data: { 
        password: hashedPassword,
        mustChangePassword: false // Réinitialisation réussie
      }
    });

    // Marquer le token comme utilisé
    await prisma.passwordReset.update({
      where: { id: passwordReset.id },
      data: { used: true }
    });

    console.log(`✅ Mot de passe réinitialisé pour: ${passwordReset.user.email}`);
    return res.status(200).json({
      success: true,
      message: 'Votre mot de passe a été réinitialisé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur resetPassword:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la réinitialisation du mot de passe'
    });
  }
};

/**
 * Changement de mot de passe par l'utilisateur connecté
 * - Vérifie l'ancien mot de passe
 * - Met à jour le mot de passe si la vérification réussit
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    // L'ID de l'utilisateur est fourni par le middleware d'authentification
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Récupérer l'utilisateur avec son mot de passe actuel
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true, email: true, mustChangePassword: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier l'ancien mot de passe
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit être différent de l\'ancien'
      });
    }

    // Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedPassword,
        mustChangePassword: false // Le mot de passe a été changé avec succès
      }
    });

    console.log(`✅ Mot de passe changé pour: ${user.email}`);
    return res.status(200).json({
      success: true,
      message: 'Votre mot de passe a été modifié avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur changePassword:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du changement de mot de passe'
    });
  }
};
