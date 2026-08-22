import { useContext } from 'react'
import { CondominiumContext } from '../context/CondominiumProvider'

const useCondominium = () => {
  const context = useContext(CondominiumContext)

  if (!context) {
    throw new Error('useCondominium debe utilizarse dentro de CondominiumProvider')
  }

  return context
}

export default useCondominium
