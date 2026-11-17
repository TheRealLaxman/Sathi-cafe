import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import menuRoutes from './routes/menu.js'
import authRoutes from './routes/auth.js'
import reservationRoutes from './routes/reservations.js'
import messageRoutes from './routes/messages.js'

dotenv.config()

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing in .env')
  process.exit(1)
}

connectDB()

const app = express()
const isProd = process.env.NODE_ENV === 'production'

// behind a hosting proxy, rate limiting would otherwise see one shared IP
app.set('trust proxy', 1)
app.use(helmet())

// comma-separated site addresses, e.g. https://sathicafe.com,https://www.sathicafe.com
const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean)

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      if (!isProd && allowedOrigins.length === 0) return callback(null, true)
      callback(null, false)
    },
  })
)

app.use(express.json({ limit: '10kb' }))

app.get('/api/health', (req, res) => res.json({ status: 'ok', cafe: 'Sathi' }))
app.use('/api/auth', authRoutes)
app.use('/api/menu', menuRoutes)
app.use('/api/reservations', reservationRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
