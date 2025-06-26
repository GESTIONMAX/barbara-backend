import express from 'express'
import { PrismaClient } from '../generated/prisma'
import packRoutes from './routes/pack' // ✅ Import de la route Pack

const app = express()
const prisma = new PrismaClient()

app.use(express.json())

// Route de test
app.get('/', (req, res) => {
  res.send('Bienvenue sur l’API Barbara Décor 🎉')
})

// ✅ Routes REST complètes pour les packs
app.use('/api/packs', packRoutes)

app.listen(3001, () => {
  console.log('✅ Backend démarré sur http://localhost:3001')
})
