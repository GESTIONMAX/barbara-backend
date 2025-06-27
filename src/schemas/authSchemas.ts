import { z } from 'zod';

// Schéma pour l'inscription
export const registerSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
  
  email: z.string()
    .email('Format email invalide')
    .max(100, 'L\'email ne peut pas dépasser 100 caractères'),
  
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre')
});

// Schéma pour la connexion
export const loginSchema = z.object({
  email: z.string()
    .email('Format email invalide'),
  
  password: z.string()
    .min(1, 'Mot de passe requis')
});

// Schéma pour modifier le profil
export const updateProfileSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .optional(),
  
  email: z.string()
    .email('Format email invalide')
    .max(100, 'L\'email ne peut pas dépasser 100 caractères')
    .optional()
});

// Types générés
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
