import { Navigate } from 'react-router-dom'
import useAuth from '../state/AuthContext.jsx'

export function RequireAuth({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

export function RequireAdmin({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export function RequireGuest({ children }) { 
  const { user } = useAuth()
  if (user) return <Navigate to="/" replace />
  return children
}