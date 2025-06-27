import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Récupérer tous les packs avec filtres optionnels
export const getAllPacks = async (req: Request, res: Response) => {
  try {
    console.log('🔍 Début getAllPacks');
    
    const { category, search } = req.query;

    // Construction dynamique du filtre
    const whereClause: any = {};

    if (category && typeof category === 'string') {
      whereClause.category = category;
    }

    if (search && typeof search === 'string') {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const packs = await prisma.packs.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ ${packs.length} pack(s) récupéré(s)`);

    return res.status(200).json({
      success: true,
      data: packs,
      count: packs.length
    });

  } catch (error) {
    console.error('🚨 ERREUR getAllPacks:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des packs'
    });
  }
};

// Récupérer un pack par ID
export const getPackById = async (req: Request, res: Response) => {
  try {
    console.log('🔍 Début getPackById');
    const { id } = req.params;

    const pack = await prisma.packs.findUnique({
      where: { id }
    });

    if (!pack) {
      return res.status(404).json({
        success: false,
        error: 'Pack non trouvé'
      });
    }

    console.log('✅ Pack récupéré:', pack.id);

    return res.status(200).json({
      success: true,
      data: pack
    });

  } catch (error) {
    console.error('🚨 ERREUR getPackById:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération du pack'
    });
  }
};

// Créer un nouveau pack
export const createPack = async (req: Request, res: Response) => {
  try {
    console.log('🔍 Début createPack');
    console.log('🔍 Body reçu:', req.body);

    const newPack = await prisma.packs.create({
      data: {
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ Pack créé:', newPack);

    return res.status(201).json({
      success: true,
      data: newPack,
      message: 'Pack créé avec succès'
    });

  } catch (error) {
    console.error('🚨 ERREUR createPack:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la création du pack'
    });
  }
};

// Mettre à jour un pack
export const updatePack = async (req: Request, res: Response) => {
  try {
    console.log('🔍 Début updatePack');
    const { id } = req.params;

    const updatedPack = await prisma.packs.update({
      where: { id },
      data: {
        ...req.body,
        updatedAt: new Date()
      }
    });

    console.log('✅ Pack mis à jour:', updatedPack);

    return res.status(200).json({
      success: true,
      data: updatedPack,
      message: 'Pack mis à jour avec succès'
    });

  } catch (error) {
    console.error('🚨 ERREUR updatePack:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour du pack'
    });
  }
};

// Supprimer un pack
export const deletePack = async (req: Request, res: Response) => {
  try {
    console.log('🔍 Début deletePack');
    const { id } = req.params;

    await prisma.packs.delete({
      where: { id }
    });

    console.log('✅ Pack supprimé:', id);

    return res.status(200).json({
      success: true,
      message: 'Pack supprimé avec succès'
    });

  } catch (error) {
    console.error('🚨 ERREUR deletePack:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la suppression du pack'
    });
  }
};
