import { Routes, Route, Link, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Reviews from './pages/Reviews.jsx'
import ReviewForm from './pages/ReviewForm.jsx'
import { useAuth } from './hooks/useAuth.js'
import ProtectedRoute from './components/ProtectedRoute.jsx'

export default function App() {
  const { user, logout } = useAuth()
  return (
    <div className="container">
      <nav className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-semibold">Course Review Board</Link>
          {user && <Link to="/reviews/new" className="text-sm">Write Review</Link>}
        </div>
        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <Link to="/login" className="btn">Login</Link>
              <Link to="/register" className="btn">Register</Link>
            </>
          ) : (
            <>
              <span className="text-sm">Logged in as <b>{user.name}</b></span>
              <button onClick={logout} className="btn">Logout</button>
            </>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/reviews/new" element={
          <ProtectedRoute><ReviewForm /></ProtectedRoute>
        } />
        <Route path="/reviews/:id" element={
          <ProtectedRoute><ReviewForm /></ProtectedRoute>
        } />
        <Route path="*" element={<div>Not Found</div>} />
      </Routes>
    </div>
  )
}
