import './config/env.js'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'
import { uploadDir, photoName, publicUploadUrl, usesRemoteStorage } from './config/uploads.js'
import { readyDB } from './config/db.js'
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

const app = express()
app.set('trust proxy', 1)
app.disable('x-powered-by')

// Cloudflare is the only public entry point; use its verified client IP.
app.use((req, res, next) => {
  const ip = req.get('CF-Connecting-IP')
  if (req.get('CF-Ray') && ip && /^[0-9a-fA-F.:]+$/.test(ip)) req.ip = ip
  next()
})

// Local runs connect in server.js; serverless runs connect here and reuse it.
app.use(async (req, res, next) => {
  if (!process.env.JWT_SECRET) return res.status(500).json({ message: 'Server is not configured' })
  try {
    await readyDB()
    next()
  } catch (err) {
    console.error('MongoDB connection failed:', err.message)
    res.status(503).json({ message: 'Service unavailable' })
  }
})

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

if (usesRemoteStorage()) {
  // Old menu records still point at /uploads/<name>; forward them to R2.
  app.get('/uploads/:name', (req, res) => {
    const name = String(req.params.name)
    if (!photoName.test(name)) return res.status(404).end()
    res.redirect(302, publicUploadUrl(name))
  })
} else {
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
}

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
