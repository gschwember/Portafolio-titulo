import { createContext, useCallback, useMemo, useState } from 'react'
import authService from '../services/auth.service'
import { USER_ROLES } from '../model/auth.constants'
import { clearAuthSession, loadAuthSession, saveAuthSession } from '../model/auth.storage'

const AuthContext = createContext(null)

const isUserApproved = (user) => user?.is_active !== false

const normalizeUserRole = (user) => {
  if (!user?.role) {
    return USER_ROLES.residente
  }

  return String(user.role).toLowerCase()
}

const toSessionPayload = (response) => {
  const user = {
    ...response.user,
    role: normalizeUserRole(response.user),
  }

  return {
    user,
    access: response.access,
    refresh: response.refresh,
  }
}

const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => loadAuthSession())

  const setNewSession = useCallback((response) => {
    const nextSession = toSessionPayload(response)
    setSession(nextSession)
    saveAuthSession(nextSession)
    return nextSession
  }, [])

  const login = useCallback(
    async (payload) => {
      const response = await authService.login(payload)
      return setNewSession(response)
    },
    [setNewSession],
  )

  const register = useCallback(
    async (payload) => {
      return authService.register(payload)
    },
    [],
  )

  const logout = useCallback(() => {
    setSession(null)
    clearAuthSession()
  }, [])

  const contextValue = useMemo(() => {
    return {
      user: session?.user || null,
      accessToken: session?.access || null,
      refreshToken: session?.refresh || null,
      isAuthenticated: Boolean(session?.access) && isUserApproved(session?.user),
      isAccountApproved: isUserApproved(session?.user),
      hasRole: (roles = []) => {
        if (!session?.user) {
          return false
        }

        if (!Array.isArray(roles) || roles.length === 0) {
          return true
        }

        return roles.includes(normalizeUserRole(session.user))
      },
      login,
      register,
      logout,
    }
  }, [session, login, register, logout])

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider }
