import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { AuthContext } from './authStore'

// Provide authentication state and actions.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch the current user session.
  const refresh = useCallback(() => {
    setLoading(true)
    return api('/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const timer = setTimeout(refresh, 0)
    return () => clearTimeout(timer)
  }, [refresh])

  useEffect(() => {
    const onUnauthorized = () => setUser(null)
    window.addEventListener('sathi:unauthorized', onUnauthorized)
    return () => window.removeEventListener('sathi:unauthorized', onUnauthorized)
  }, [])

  // Log out and clear the current user.
  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {})
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      refresh,
      logout,
      can: (permission) => Boolean(user?.permissions?.includes(permission)),
    }),
    [user, loading, refresh, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
