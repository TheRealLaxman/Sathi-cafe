import rateLimit from 'express-rate-limit'

const skip = () => process.env.NODE_ENV === 'test'
const base = { windowMs: 15 * 60 * 1000, skip }

export const loginLimiter = rateLimit({
  ...base,
  limit: 10,
  message: { message: 'Too many login attempts. Try again later.' },
})

export const refreshLimiter = rateLimit({
  ...base,
  limit: 60,
  message: { message: 'Too many session requests. Please try again later.' },
})

export const formLimiter = rateLimit({
  ...base,
  limit: 20,
  message: { message: 'Too many requests. Please try again later.' },
})

export const apiLimiter = rateLimit({
  ...base,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
})
