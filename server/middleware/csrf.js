import { devOrigins, isProd, siteOrigins } from '../utils/env.js'
import { httpError } from '../utils/httpError.js'

const unsafe = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

// Check unsafe requests for a trusted header and origin.
export default function csrf(req, res, next) {
  if (!unsafe.has(req.method)) return next()

  if (req.get('X-Requested-With') !== 'XMLHttpRequest') {
    return next(httpError(403, 'Invalid request header'))
  }

  const origin = req.get('Origin')
  if (origin) {
    const allowed = isProd() ? siteOrigins() : [...siteOrigins(), ...devOrigins()]
    if (allowed.length && !allowed.includes(origin)) {
      return next(httpError(403, 'Request origin is not allowed'))
    }
  }

  next()
}
