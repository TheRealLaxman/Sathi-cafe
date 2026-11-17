const TOKEN_KEY = 'sathi_token'
export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

// empty in dev (vite proxies /api), set VITE_API_URL in production
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

export async function api(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (auth) headers.Authorization = `Bearer ${getToken()}`

  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    if (res.status === 401 && auth) clearToken()
    throw new Error(data.message || 'Something went wrong')
  }
  return data
}
