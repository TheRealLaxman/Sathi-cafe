// Create an error with an HTTP status code.
export function httpError(status, message, extra = {}) {
  const error = new Error(message)
  error.status = status
  return Object.assign(error, extra)
}
