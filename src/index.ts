import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

dotenv.config()
const app = express()
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())

// Route de test
app.get('/', async (req, res) => {
  res.json({ message: 'Bienvenue sur le backend Barbara 🎉' })
})

// Exemple avec Prisma
app.get('/users', async (req, res) => {
  const users = await prisma.user.findMany()
  res.json(users)
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`)
})

