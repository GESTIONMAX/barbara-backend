import { z } from 'zod';

// Énums pour les catégories (selon votre schema Prisma)
export const PackCategory = z.enum([
  'anniversaire',
  'mariage', 
  'entreprise',
  'autre',
  'anniversaireballons'
]);

// Schéma pour créer un Pack
export const createPackSchema = z.object({
  name: z.string()
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  
  description: z.string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(1000, 'La description ne peut pas dépasser 1000 caractères'),
  
  price: z.number()
    .positive('Le prix doit être positif')
    .max(10000, 'Le prix ne peut pas dépasser 10 000€'),
  
  category: PackCategory,
  
  images: z.array(z.string().url('URL d\'image invalide'))
    .min(1, 'Au moins une image est requise')
    .max(10, 'Maximum 10 images par pack'),
  
  features: z.array(z.string())
    .min(1, 'Au moins une caractéristique est requise')
    .max(20, 'Maximum 20 caractéristiques par pack')
});

// Schéma pour modifier un Pack (tous les champs optionnels)
export const updatePackSchema = createPackSchema.partial();

// Schéma pour les paramètres d'URL
export const packParamsSchema = z.object({
  id: z.string().min(1, 'ID requis')
});

// Types générés automatiquement
export type CreatePackInput = z.infer<typeof createPackSchema>;
export type UpdatePackInput = z.infer<typeof updatePackSchema>;
export type PackParams = z.infer<typeof packParamsSchema>;
