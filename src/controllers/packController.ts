import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export const getAllPacks = async (req: Request, res: Response) => {
  try {
    const { category, active = 'true' } = req.query;
    
    const packs = await prisma.pack.findMany({
      where: {
        ...(category && { category: category as string }),
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      success: true,
      data: packs,
      count: packs.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des packs:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des packs'
    });
  }
};

export const getPackById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const pack = await prisma.pack.findUnique({
      where: { id }
    });
    
    if (!pack) {
      return res.status(404).json({
        success: false,
        error: 'Pack non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: pack
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du pack:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération du pack'
    });
  }
};

export const createPack = async (req: Request, res: Response) => {
  try {
    const packData = req.body;
    
    const newPack = await prisma.pack.create({
      data: packData
    });
    
    res.status(201).json({
      success: true,
      data: newPack,
      message: 'Pack créé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la création du pack:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la création du pack'
    });
  }
};

export const updatePack = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const existingPack = await prisma.pack.findUnique({
      where: { id }
    });
    
    if (!existingPack) {
      return res.status(404).json({
        success: false,
        error: 'Pack non trouvé'
      });
    }
    
    const updatedPack = await prisma.pack.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });
    
    res.json({
      success: true,
      data: updatedPack,
      message: 'Pack mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du pack:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour du pack'
    });
  }
};

export const deletePack = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const existingPack = await prisma.pack.findUnique({
      where: { id }
    });
    
    if (!existingPack) {
      return res.status(404).json({
        success: false,
        error: 'Pack non trouvé'
      });
    }
    
    await prisma.pack.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: 'Pack supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du pack:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la suppression du pack'
    });
  }
};
