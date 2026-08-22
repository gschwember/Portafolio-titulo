import { apiGet } from './client'

const PUBLIC_ENDPOINTS = {
  economicIndicators: '/v1/economic-indicators',
}

const getEconomicIndicatorsRequest = async () => {
  return apiGet(PUBLIC_ENDPOINTS.economicIndicators)
}

export { getEconomicIndicatorsRequest }
