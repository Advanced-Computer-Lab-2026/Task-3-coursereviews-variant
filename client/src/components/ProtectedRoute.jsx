import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  // wait for /auth/me to finish restoring the session, otherwise a hard
  // reload of a protected URL would bounce to /login before user is set
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}
