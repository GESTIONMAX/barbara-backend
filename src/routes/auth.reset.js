const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const resetRouter = express.Router();
const prisma = new PrismaClient();

/**
 * Endpoint temporaire pour réinitialiser le mot de passe administrateur
 */
resetRouter.post('/reset-password', async (req, res) => {
  try {
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
    
    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Aucun utilisateur trouvé avec l'email: ${email}`
      });
    }
    
    // Mettre à jour l'utilisateur
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
      error: error.message
    });
  }
});

module.exports = resetRouter;
