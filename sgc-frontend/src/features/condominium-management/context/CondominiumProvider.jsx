import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import useAuth from '@features/auth/hooks/useAuth'
import { listCondominiumsRequest } from '../api/billing.api'

const STORAGE_KEY = 'sgc.activeCondominiumId'

const CondominiumContext = createContext(null)

const CondominiumProvider = ({ children }) => {
  const { isAuthenticated, accessToken } = useAuth()
  const [condominiums, setCondominiums] = useState([])
  const [activeCondominiumId, setActiveCondominiumId] = useState(() => {
    const storedValue = localStorage.getItem(STORAGE_KEY)
    return storedValue ? Number(storedValue) : null
  })
  const [isLoading, setIsLoading] = useState(false)

  const loadCondominiums = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setCondominiums([])
      return
    }

    setIsLoading(true)
    try {
      const rows = await listCondominiumsRequest(accessToken)
      setCondominiums(Array.isArray(rows) ? rows : [])
    } catch {
      setCondominiums([])
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, accessToken])

  useEffect(() => {
    loadCondominiums()
  }, [loadCondominiums])

  useEffect(() => {
    if (!condominiums.length) {
      setActiveCondominiumId(null)
      localStorage.removeItem(STORAGE_KEY)
      return
    }

    const exists = condominiums.some((item) => item.id === activeCondominiumId)
    if (!exists) {
      const fallbackId = condominiums[0].id
      setActiveCondominiumId(fallbackId)
      localStorage.setItem(STORAGE_KEY, String(fallbackId))
    }
  }, [condominiums, activeCondominiumId])

  const setActiveCondominium = useCallback((condominiumId) => {
    const nextId = Number(condominiumId)
    setActiveCondominiumId(nextId)
    localStorage.setItem(STORAGE_KEY, String(nextId))
  }, [])

  const activeCondominium = useMemo(() => {
    return condominiums.find((item) => item.id === activeCondominiumId) || null
  }, [condominiums, activeCondominiumId])

  const value = useMemo(() => {
    return {
      condominiums,
      activeCondominiumId,
      activeCondominium,
      isLoading,
      setActiveCondominium,
      reloadCondominiums: loadCondominiums,
    }
  }, [condominiums, activeCondominiumId, activeCondominium, isLoading, setActiveCondominium, loadCondominiums])

  return <CondominiumContext.Provider value={value}>{children}</CondominiumContext.Provider>
}

export { CondominiumContext, CondominiumProvider }
