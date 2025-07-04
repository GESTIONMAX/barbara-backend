import nodemailer from 'nodemailer';
import { createTransport, SendMailOptions } from 'nodemailer';

/**
 * Configuration et service d'envoi d'emails
 * Utilise SMTP ou un service de test selon l'environnement
 */
class EmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@barbaradecors.fr';
    
    // En production, utiliser les paramètres SMTP configurés (Brevo)
    if (this.isProduction) {
      console.log(`📧 Configuration SMTP: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}`);
      
      this.transporter = createTransport({
        host: process.env.EMAIL_HOST,       // smtp-relay.brevo.com
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,      // Votre email sur Brevo
          pass: process.env.EMAIL_PASSWORD,  // Clé SMTP générée dans Brevo
        },
        // Options spécifiques pour Brevo
        tls: {
          // N'échoue pas si le certificat est auto-signé ou invalide
          rejectUnauthorized: false
        }
      });
      
      // Vérifier la connexion au démarrage
      this.verifyConnection();
    } 
    // En développement, utiliser Ethereal (service de test)
    else {
      // Le service sera créé à la demande pour éviter de bloquer au démarrage
      this.transporter = createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: process.env.ETHEREAL_EMAIL || '',
          pass: process.env.ETHEREAL_PASSWORD || '',
        },
      });
      
      // En développement, créer un compte de test si pas configuré
      if (!process.env.ETHEREAL_EMAIL) {
        this.createTestAccount();
      }
    }
  }

  /**
   * Vérifie la connexion au serveur SMTP
   * Utile pour détecter les problèmes de configuration au démarrage
   */
  private async verifyConnection() {
    try {
      // Vérifier la connexion au serveur SMTP
      await this.transporter.verify();
      console.log('✅ Connexion SMTP établie avec succès');
    } catch (error) {
      console.error('❌ Erreur de connexion SMTP:', error);
      console.error('⚠️ Vérifiez les paramètres EMAIL_HOST, EMAIL_PORT, EMAIL_USER et EMAIL_PASSWORD dans votre .env');
    }
  }

  /**
   * Crée un compte de test Ethereal pour le développement
   */
  private async createTestAccount() {
    try {
      console.log('🔧 Création d\'un compte de test Ethereal pour les emails...');
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      
      console.log('✅ Compte de test Ethereal créé:');
      console.log(`📧 Email: ${testAccount.user}`);
      console.log(`🔑 Password: ${testAccount.pass}`);
      console.log('🔍 Tous les emails envoyés seront visibles sur: https://ethereal.email');
    } catch (error) {
      console.error('❌ Impossible de créer un compte de test Ethereal:', error);
    }
  }

  /**
   * Envoie un email
   * @param options Options d'envoi (to, subject, text, html...)
   * @returns Information sur l'envoi de l'email
   */
  async sendEmail(options: SendMailOptions) {
    // Définir l'expéditeur si non spécifié
    if (!options.from) {
      options.from = this.fromEmail;
    }
    
    try {
      const info = await this.transporter.sendMail(options);
      
      // En développement, afficher l'URL de prévisualisation Ethereal
      if (!this.isProduction && info.messageId) {
        console.log('📩 Email envoyé:', info.messageId);
        console.log('🔍 URL de prévisualisation:', nodemailer.getTestMessageUrl(info));
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
      return { success: false, error };
    }
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   * @param to Adresse email du destinataire
   * @param resetToken Token de réinitialisation
   * @param username Nom d'utilisateur
   * @returns Résultat de l'envoi
   */
  async sendPasswordResetEmail(to: string, resetToken: string, username: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const subject = 'Barbara Décor - Réinitialisation de votre mot de passe';
    
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background-color: #9c8f61; padding: 20px; text-align: center;">
          <img src="${process.env.FRONTEND_URL}/logo.png" alt="Barbara Décor" style="max-width: 150px;">
        </div>
        <div style="padding: 30px; border: 1px solid #e0e0e0; background-color: #fff;">
          <h2 style="color: #9c8f61; text-align: center; margin-bottom: 25px; font-weight: 300;">Réinitialisation de votre mot de passe</h2>
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 15px;">Bonjour ${username},</p>
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 15px;">Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Barbara Décor.</p>
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 25px;">Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe. Ce lien est valide pendant 30 minutes.</p>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${resetUrl}" style="background-color: #9c8f61; color: white; padding: 15px 30px; text-decoration: none; border-radius: 3px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">Réinitialiser mon mot de passe</a>
          </div>
          
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 15px;">Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.</p>
          <p style="font-size: 14px; line-height: 1.5; margin-top: 25px; color: #666;">Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur:</p>
          <p style="word-break: break-all; font-size: 13px; color: #666; background-color: #f5f5f5; padding: 10px; border-radius: 3px;">${resetUrl}</p>
          
          <div style="margin-top: 40px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
            <p style="font-size: 13px; color: #999; text-align: center; margin-bottom: 5px;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            <p style="font-size: 13px; color: #999; text-align: center;">© ${new Date().getFullYear()} Barbara Décor - Tous droits réservés</p>
          </div>
        </div>
      </div>
    `;
    
    return this.sendEmail({
      to,
      subject,
      html,
      text: `Bonjour ${username},\n\nVous avez demandé la réinitialisation de votre mot de passe.\n\nVoici votre lien de réinitialisation (valide 30 minutes):\n${resetUrl}\n\nSi vous n'avez pas demandé cette réinitialisation, ignorez cet email.\n\n© ${new Date().getFullYear()} Barbara Décors`
    });
  }
}

// Exporter une seule instance du service
export const emailService = new EmailService();
