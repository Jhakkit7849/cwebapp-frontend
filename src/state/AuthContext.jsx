import React, { createContext, useContext, useState } from 'react'
import { api } from '../utils/api.js'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user'); return raw ? JSON.parse(raw) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  const login = async (email, password) => {
    const res = await api('/auth/login', { method:'POST', body:{ email, password }, noAuth: true })
    setUser(res.user); setToken(res.token)
    localStorage.setItem('user', JSON.stringify(res.user))
    localStorage.setItem('token', res.token)
    return res.user
  }

  const logout = () => {
    setUser(null); setToken(null)
    localStorage.removeItem('user'); localStorage.removeItem('token')
  }

  const isAdmin = !!user && user.role === 'admin'
  const value = { user, token, login, logout, setUser, setToken, isAdmin }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export default function useAuth() { return useContext(AuthCtx) }
