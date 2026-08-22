import { useContext } from 'react'
import { AuthContext } from '../context/AuthProvider'

const useAuth = () => {
  const authContext = useContext(AuthContext)

  if (!authContext) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider')
  }

  return authContext
}

export default useAuth
