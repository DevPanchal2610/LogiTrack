import { createContext, useContext, useState, useCallback } from 'react'
import { authApi } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lt_user')) } catch { return null }
  })

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password })
    const { token, ...userData } = res.data.data
    localStorage.setItem('lt_token', token)
    localStorage.setItem('lt_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const register = useCallback(async (formData) => {
    const res = await authApi.register(formData)
    const { token, ...userData } = res.data.data
    localStorage.setItem('lt_token', token)
    localStorage.setItem('lt_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('lt_token')
    localStorage.removeItem('lt_user')
    setUser(null)
    toast.success('Logged out successfully')
  }, [])

  const isAdmin    = user?.role === 'ADMIN'
  const isVendor   = user?.role === 'VENDOR'
  const isCustomer = user?.role === 'CUSTOMER'

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAdmin, isVendor, isCustomer }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
