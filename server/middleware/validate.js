import { httpError } from '../utils/httpError.js'

// Validate the request body against a schema.
export default function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const first = result.error.issues[0]
      return next(httpError(400, `${first.path.join('.') || 'Request'}: ${first.message}`))
    }
    req.body = result.data
    next()
  }
}
