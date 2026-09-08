import { AUTH_STORAGE_KEY, AUTH_STORAGE_VERSION } from './auth.constants'

const loadAuthUser = () => {
  try {
    const rawValue = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!rawValue) {
      return null
    }

    const parsed = JSON.parse(rawValue)

    if (!parsed?.user || parsed.user.is_active === false) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }

    saveAuthUser(parsed.user)
    return parsed.user
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

const saveAuthUser = (user) => {
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({ version: AUTH_STORAGE_VERSION, user }),
  )
}

const clearAuthUser = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export { clearAuthUser, loadAuthUser, saveAuthUser }
