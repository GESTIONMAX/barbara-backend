import { Router } from 'express';
import { 
  forgotPassword, 
  resetPassword,
  changePassword
} from '../controllers/passwordResetController';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { 
  forgotPasswordSchema,
  resetPasswordSchema, 
  changePasswordSchema 
} from '../schemas/passwordResetSchemas';

const router = Router();

// POST /api/password/forgot - Demande de réinitialisation de mot de passe (public)
router.post(
  '/forgot',
  validateBody(forgotPasswordSchema),
  forgotPassword
);

// POST /api/password/reset - Réinitialisation du mot de passe avec token (public)
router.post(
  '/reset',
  validateBody(resetPasswordSchema),
  resetPassword
);

// POST /api/password/change - Changement de mot de passe (utilisateur connecté)
router.post(
  '/change',
  authenticateToken,
  validateBody(changePasswordSchema),
  changePassword
);

export default router;
