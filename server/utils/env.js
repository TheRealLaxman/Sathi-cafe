export const isProd = () => process.env.NODE_ENV === 'production'

// Parse configured client origins from the environment.
export const siteOrigins = () =>
  (process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean)

// Return local development origins.
export const devOrigins = () => [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]
