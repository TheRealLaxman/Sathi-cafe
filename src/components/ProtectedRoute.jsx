import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// Restrict access to authenticated users only.
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <p className="px-5 py-20 text-center text-ink/60">Checking your session...</p>
  }
  return user ? children : <Navigate to="/admin/login" replace />
}
