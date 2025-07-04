const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement si un fichier .env existe
try {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  }
} catch (error) {
  console.warn('⚠️ Impossible de charger le fichier .env:', error.message);
}

// Récupérer l'URL de la base de données depuis les variables d'environnement
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@postgres-database:5432/postgres';

// Email cible par défaut (peut être remplacé par saisie interactive)
let email = process.env.RESET_EMAIL || 'adv@barbaradecors.fr';

console.log('🔐 Outil de réinitialisation de mot de passe administrateur');
console.log('------------------------------------------------------');
console.log(`💾 Base de données: ${databaseUrl.replace(/:\/\/.*?@/, '://***@')}`);

// Création d'une interface de saisie sécurisée
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer));
  });
}

async function resetPassword() {
  try {
    // Interface interactive pour confirmer l'email ou le changer
    const confirmEmail = await prompt(`✉️ Confirmez l'email cible (${email}): `);
    if (confirmEmail && confirmEmail.trim() !== '') {
      email = confirmEmail.trim();
    }
    console.log(`📨 Email cible confirmé: ${email}`);
    
    // Création d'une instance Prisma avec l'URL de la base de données
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    // Vérification de l'existence de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!user) {
      console.error(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
      return;
    }
    
    console.log(`✅ Utilisateur trouvé: ${user.name || user.email} (${user.role})`);
    
    // Génération d'un mot de passe temporaire fort si l'utilisateur le souhaite
    let newPassword = '';
    const useRandomPassword = (await prompt('🆘 Générer un mot de passe aléatoire fort? (o/N): ')).toLowerCase() === 'o';
    
    if (useRandomPassword) {
      // Générer un mot de passe aléatoire fort (16 caractères)
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
      for (let i = 0; i < 16; i++) {
        newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } else {
      // Demander à l'utilisateur de saisir un nouveau mot de passe
      let passwordConfirmed = false;
      while (!passwordConfirmed) {
        newPassword = await prompt('🔐 Nouveau mot de passe: ');
        
        // Vérification de la force du mot de passe
        if (newPassword.length < 12) {
          console.log('⚠️ Le mot de passe doit contenir au moins 12 caractères.');
          continue;
        }
        
        // Vérification des critères de complexité
        const hasUpperCase = /[A-Z]/.test(newPassword);
        const hasLowerCase = /[a-z]/.test(newPassword);
        const hasNumbers = /\d/.test(newPassword);
        const hasSpecialChars = /[^A-Za-z0-9]/.test(newPassword);
        
        if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChars) {
          console.log('⚠️ Le mot de passe doit contenir des majuscules, minuscules, chiffres et caractères spéciaux.');
          continue;
        }
        
        // Confirmation du mot de passe
        const confirmPassword = await prompt('🔐 Confirmez le mot de passe: ');
        if (newPassword !== confirmPassword) {
          console.log('⚠️ Les mots de passe ne correspondent pas.');
          continue;
        }
        
        passwordConfirmed = true;
      }
    }

    // Hacher le nouveau mot de passe avec un facteur de coût plus élevé
    const hashedPassword = await bcrypt.hash(newPassword, 12); // Facteur de coût augmenté à 12
    
    // Mettre à jour l'utilisateur
    await prisma.user.update({
      where: { email },
      data: { 
        password: hashedPassword,
        updatedAt: new Date() // Mise à jour explicite du timestamp
      },
    });
    
    console.log(`\n🔒 Mot de passe modifié avec succès pour ${email}!`);
    
    if (useRandomPassword) {
      console.log(`❗ IMPORTANT: Voici le nouveau mot de passe temporaire: ${newPassword}`);
      console.log(`❗ CONSERVEZ CE MOT DE PASSE EN LIEU SÛR ET FORCEZ L'UTILISATEUR À LE CHANGER DÈS SA PREMIÈRE CONNEXION!`);
    } else {
      console.log(`✅ Le mot de passe a été changé selon vos spécifications.`);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation du mot de passe:', error);
  } finally {
    rl.close();
    if (typeof prisma !== 'undefined') {
      await prisma.$disconnect();
    }
  }
}

resetPassword();
