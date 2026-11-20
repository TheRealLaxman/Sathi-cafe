import { isProd } from '../utils/env.js'
import { httpError } from '../utils/httpError.js'

// Pass a 404 error to the error handler.
export function notFound(req, res, next) {
  next(httpError(404, 'Not found'))
}

// Convert errors into JSON responses.
export function errorHandler(err, req, res, next) {
  let status = err.status || 500
  let message = err.message

  if (err.name === 'CastError' || err.name === 'ValidationError' || err.name === 'MulterError') {
    status = 400
  }
  if (err.code === 11000) {
    status = 409
    message = 'That value is already in use'
  }
  if (err instanceof SyntaxError && 'body' in err) {
    status = 400
    message = 'Invalid JSON'
  }
  if (status >= 500) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err)
    if (isProd()) message = 'Server error'
  }

  if (res.headersSent) return next(err)
  res.status(status).json({ message })
}
