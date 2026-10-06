import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  // Session is still being restored from the token via /auth/me; don't redirect yet.
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
