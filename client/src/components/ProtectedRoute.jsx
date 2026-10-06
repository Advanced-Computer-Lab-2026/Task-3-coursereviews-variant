import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div role="status" className="text-sm text-zinc-600">Loading session…</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}
