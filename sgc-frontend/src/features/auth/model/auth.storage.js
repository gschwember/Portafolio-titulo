import { AUTH_STORAGE_KEY } from './auth.constants'

const loadAuthSession = () => {
  try {
    const rawValue = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!rawValue) {
      return null
    }

    const parsed = JSON.parse(rawValue)

    // Limpia sesiones obsoletas de cuentas pendientes de aprobacion.
    if (parsed?.user?.is_active === false) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }

    return parsed
  } catch {
    return null
  }
}

const saveAuthSession = (session) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

const clearAuthSession = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export { clearAuthSession, loadAuthSession, saveAuthSession }
