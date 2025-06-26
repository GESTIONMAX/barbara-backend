import { Router } from 'express';
import {
  getAllPacks,
  getPackById,
  createPack,
  updatePack,
  deletePack
} from '../controllers/packController';

const router = Router();

// GET /api/packs - Récupérer tous les packs
router.get('/', getAllPacks);

// GET /api/packs/:id - Récupérer un pack par ID
router.get('/:id', getPackById);

// POST /api/packs - Créer un nouveau pack
router.post('/', createPack);

// PUT /api/packs/:id - Mettre à jour un pack
router.put('/:id', updatePack);

// DELETE /api/packs/:id - Supprimer un pack
router.delete('/:id', deletePack);

export default router;
