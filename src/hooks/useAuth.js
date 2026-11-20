import { useContext } from 'react'
import { AuthContext } from '../context/authStore'

// Access the current authentication context.
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
