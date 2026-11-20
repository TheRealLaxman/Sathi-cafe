export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

let refreshing = null
// Skip token refresh for auth endpoints.
const noRefresh = (path) =>
  ['/auth/login', '/auth/refresh', '/auth/logout', '/auth/forgot-password'].includes(path) ||
  path.startsWith('/auth/reset-password/')

// Refresh session once for concurrent requests.
function refreshSession() {
  if (!refreshing) {
    refreshing = fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Session expired')
        return res.json()
      })
      .catch((err) => {
        window.dispatchEvent(new Event('sathi:unauthorized'))
        throw err
      })
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

// Send API request and retry after refresh.
async function request(path, { method = 'GET', body } = {}, allowRefresh = true) {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData
  const headers = { 'X-Requested-With': 'XMLHttpRequest' }
  if (body && !isForm) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  })
  const data = await res.json().catch(() => ({}))

  if (res.status === 401 && allowRefresh && !noRefresh(path)) {
    await refreshSession()
    return request(path, { method, body }, false)
  }
  if (!res.ok) throw new Error(data.message || 'Something went wrong')
  return data
}

// Export request helper as the API client.
export const api = (path, options) => request(path, options)
