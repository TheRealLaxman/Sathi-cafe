import './config/env.js'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'
import { ensureUploadDir, uploadDir } from './config/uploads.js'
import authRoutes from './routes/auth.js'
import menuRoutes from './routes/menu.js'
import reservationRoutes from './routes/reservations.js'
import messageRoutes from './routes/messages.js'
import orderRoutes from './routes/orders.js'
import uploadRoutes from './routes/uploads.js'
import adminRoutes from './routes/admins.js'
import auditRoutes from './routes/audit.js'
import csrf from './middleware/csrf.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'
import { apiLimiter } from './middleware/limiters.js'
import { devOrigins, isProd, siteOrigins } from './utils/env.js'
import { mailConfigured } from './utils/mailer.js'

await ensureUploadDir()

const app = express()
app.set('trust proxy', 1)
app.disable('x-powered-by')

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      useDefaults: false,
      reportOnly: !isProd(),
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'data:'],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        scriptSrcAttr: [],
        styleSrc: ["'self'", "'unsafe-inline'"],
        upgradeInsecureRequests: isProd() ? [] : null,
      },
    },
  })
)

const allowed = isProd() ? siteOrigins() : [...siteOrigins(), ...devOrigins()]
app.use(
  cors({
    credentials: true,
    // Allow only configured site origins.
    origin(origin, callback) {
      if (!origin || allowed.includes(origin)) return callback(null, true)
      callback(null, false)
    },
  })
)

app.use(cookieParser())
app.use(express.json({ limit: '10kb' }))

app.get('/api/health', (req, res) => {
  const ready = mongoose.connection.readyState === 1
  res.status(ready ? 200 : 503).json({ status: ready ? 'ok' : 'unavailable', cafe: 'Sathi' })
})

app.get('/api/config', (req, res) => res.json({ emailEnabled: mailConfigured() }))

app.use('/api', apiLimiter)
app.use(csrf)

app.use(
  '/uploads',
  express.static(uploadDir, {
    index: false,
    dotfiles: 'deny',
    maxAge: '7d',
    immutable: true,
    // Set security headers for served uploads.
    setHeaders(res) {
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox")
    },
  })
)

app.use('/api/auth', authRoutes)
app.use('/api/menu', menuRoutes)
app.use('/api/reservations', reservationRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/uploads', uploadRoutes)
app.use('/api/admins', adminRoutes)
app.use('/api/audit', auditRoutes)

app.use('/api', notFound)
app.use(errorHandler)

export default app
