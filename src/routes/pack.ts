// src/routes/pack.ts
import { Router, Request, Response } from 'express'
import { PrismaClient } from '../../generated/prisma'

const router = Router()
const prisma = new PrismaClient()

// GET all packs
router.get('/', async (req: Request, res: Response) => {
  const packs = await prisma.pack.findMany()
  res.json(packs)
})

// GET one pack by ID
router.get('/:id', async (req: Request, res: Response) => {
  const pack = await prisma.pack.findUnique({
    where: { id: req.params.id }
  })
  if (!pack) return res.status(404).json({ error: 'Pack non trouvé' })
  res.json(pack)
})

// POST create new pack
router.post('/', async (req: Request, res: Response) => {
  try {
    const newPack = await prisma.pack.create({
      data: req.body,
    })
    res.status(201).json(newPack)
  } catch (error) {
    res.status(400).json({ error: 'Erreur de création' })
  }
})

// PUT update a pack
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const updated = await prisma.pack.update({
      where: { id: req.params.id },
      data: req.body,
    })
    res.json(updated)
  } catch (error) {
    res.status(400).json({ error: 'Erreur de mise à jour' })
  }
})

// DELETE a pack
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.pack.delete({
      where: { id: req.params.id }
    })
    res.status(204).end()
  } catch (error) {
    res.status(400).json({ error: 'Erreur de suppression' })
  }
})

export default router
