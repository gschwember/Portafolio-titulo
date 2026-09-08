import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import authService from '../services/auth.service'
import { USER_ROLES } from '../model/auth.constants'
import { clearAuthUser, loadAuthUser, saveAuthUser } from '../model/auth.storage'

const AuthContext = createContext(null)
const DEFAULT_REFRESH_DELAY_MS = 15 * 60 * 1000
const REFRESH_EARLY_MS = 60 * 1000

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
  }
}

const getAccessRefreshDelay = (accessToken) => {
  try {
    const encodedPayload = accessToken.split('.')[1]
    const base64Payload = encodedPayload.replace(/-/g, '+').replace(/_/g, '/')
    const paddedPayload = base64Payload.padEnd(Math.ceil(base64Payload.length / 4) * 4, '=')
    const payload = JSON.parse(window.atob(paddedPayload))
    const expiresAt = Number(payload.exp) * 1000

    if (!Number.isFinite(expiresAt)) {
      return DEFAULT_REFRESH_DELAY_MS
    }

    return Math.max(expiresAt - Date.now() - REFRESH_EARLY_MS, 1000)
  } catch {
    return DEFAULT_REFRESH_DELAY_MS
  }
}

const AuthProvider = ({ children }) => {
  const [initialUser] = useState(() => loadAuthUser())
  const [session, setSession] = useState(() => ({ user: initialUser, access: null }))
  const [isInitializing, setIsInitializing] = useState(Boolean(initialUser))

  const clearSession = useCallback(() => {
    setSession({ user: null, access: null })
    clearAuthUser()
  }, [])

  const setNewSession = useCallback((response) => {
    const nextSession = toSessionPayload(response)
    setSession(nextSession)
    saveAuthUser(nextSession.user)
    return nextSession
  }, [])

  useEffect(() => {
    if (!initialUser) {
      return undefined
    }

    let isActive = true

    authService.refreshToken()
      .then((response) => {
        if (isActive) {
          setNewSession(response)
        }
      })
      .catch(() => {
        if (isActive) {
          clearSession()
        }
      })
      .finally(() => {
        if (isActive) {
          setIsInitializing(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [clearSession, initialUser, setNewSession])

  useEffect(() => {
    if (!session.access || isInitializing) {
      return undefined
    }

    let isActive = true
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await authService.refreshToken()
        if (isActive) {
          setNewSession(response)
        }
      } catch {
        if (isActive) {
          clearSession()
        }
      }
    }, getAccessRefreshDelay(session.access))

    return () => {
      isActive = false
      window.clearTimeout(timeoutId)
    }
  }, [clearSession, isInitializing, session.access, setNewSession])

  const login = useCallback(
    async (payload) => {
      const response = await authService.login(payload)
      return setNewSession(response)
    },
    [setNewSession],
  )

  const register = useCallback(async (payload) => authService.register(payload), [])

  const logout = useCallback(async () => {
    clearSession()
    try {
      await authService.logout()
    } catch {
      // La sesion local debe cerrarse incluso si el servidor no esta disponible.
    }
  }, [clearSession])

  const contextValue = useMemo(() => {
    return {
      user: session.user,
      accessToken: session.access,
      isAuthenticated: Boolean(session.access) && isUserApproved(session.user),
      isAccountApproved: isUserApproved(session.user),
      hasRole: (roles = []) => {
        if (!session.user) {
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

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50" role="status" aria-live="polite">
        <div className="flex items-center gap-3 text-sm font-semibold text-stone-600">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-amber-600" />
          Verificando sesión…
        </div>
      </div>
    )
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider }
