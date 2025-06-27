import { Router } from 'express';
import {
  getAllPacks,
  getPackById,
  createPack,
  updatePack,
  deletePack
} from '../controllers/packController';
import { validateBody, validateParams } from '../middleware/validation';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { 
  createPackSchema, 
  updatePackSchema, 
  packParamsSchema 
} from '../schemas/packSchemas';

const router = Router();

// GET /api/packs - Récupérer tous les packs (PUBLIC)
router.get('/', getAllPacks);

// GET /api/packs/:id - Récupérer un pack par ID (PUBLIC)
router.get('/:id', validateParams(packParamsSchema), getPackById);

// POST /api/packs - Créer un nouveau pack (ADMIN UNIQUEMENT)
router.post('/', 
  authenticateToken, 
  requireAdmin, 
  validateBody(createPackSchema), 
  createPack
);

// PUT /api/packs/:id - Mettre à jour un pack (ADMIN UNIQUEMENT)
router.put('/:id', 
  authenticateToken,
  requireAdmin,
  validateParams(packParamsSchema),
  validateBody(updatePackSchema),
  updatePack
);

// DELETE /api/packs/:id - Supprimer un pack (ADMIN UNIQUEMENT)
router.delete('/:id', 
  authenticateToken, 
  requireAdmin, 
  validateParams(packParamsSchema), 
  deletePack
);

export default router;