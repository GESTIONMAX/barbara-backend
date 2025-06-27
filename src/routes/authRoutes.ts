import { Router } from 'express';
import { register, login, me } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { registerSchema, loginSchema } from '../schemas/authSchemas';

const router = Router();

// POST /api/auth/register - Inscription
router.post('/register', validateBody(registerSchema), register);

// POST /api/auth/login - Connexion
router.post('/login', validateBody(loginSchema), login);

// GET /api/auth/me - Profil utilisateur connecté
router.get('/me', authenticateToken, me);

export default router;
