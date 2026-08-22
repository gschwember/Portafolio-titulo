import { apiGet } from '@shared/api/client'

const getResidents = async () => {
  return apiGet('/residents/')
}

export { getResidents }
