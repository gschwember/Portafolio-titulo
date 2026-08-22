import { apiDelete, apiGet, apiPatch, apiPost, apiPostForm } from '@shared/api/client'

const BILLING_ENDPOINTS = {
  condominiums: '/v1/billing/condominiums/',
  units: '/v1/billing/units/',
  residentAssignments: '/v1/billing/resident-assignments/',
  billingPeriods: '/v1/billing/billing-periods/',
  commonExpenses: '/v1/billing/common-expenses/',
  payments: '/v1/billing/payments/',
  paymentReceipts: '/v1/billing/payment-receipts/',
  commonSpaces: '/v1/billing/common-spaces/',
  users: '/v1/users/',
  meterReadings: '/v1/billing/meter-readings/',
}

const buildQuery = (params = {}) => {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

const listCondominiumsRequest = (accessToken) => apiGet(BILLING_ENDPOINTS.condominiums, { accessToken })
const createCondominiumRequest = (payload, accessToken) => apiPost(BILLING_ENDPOINTS.condominiums, payload, { accessToken })

const listUnitsRequest = (accessToken) => apiGet(BILLING_ENDPOINTS.units, { accessToken })
const createUnitRequest = (payload, accessToken) => apiPost(BILLING_ENDPOINTS.units, payload, { accessToken })

const listResidentAssignmentsRequest = (accessToken) => apiGet(BILLING_ENDPOINTS.residentAssignments, { accessToken })
const createResidentAssignmentRequest = (payload, accessToken) => apiPost(BILLING_ENDPOINTS.residentAssignments, payload, { accessToken })
const deleteResidentAssignmentRequest = (assignmentId, accessToken) =>
  apiDelete(`${BILLING_ENDPOINTS.residentAssignments}${assignmentId}/`, { accessToken })

const listCommonSpacesRequest = (accessToken) => apiGet(BILLING_ENDPOINTS.commonSpaces, { accessToken })
const createCommonSpaceRequest = (payload, accessToken) => apiPost(BILLING_ENDPOINTS.commonSpaces, payload, { accessToken })

const listBillingPeriodsRequest = (accessToken, params = {}) =>
  apiGet(`${BILLING_ENDPOINTS.billingPeriods}${buildQuery(params)}`, { accessToken })

const listCommonExpensesRequest = (accessToken, params = {}) =>
  apiGet(`${BILLING_ENDPOINTS.commonExpenses}${buildQuery(params)}`, { accessToken })

const listPaymentsRequest = (accessToken, params = {}) => apiGet(`${BILLING_ENDPOINTS.payments}${buildQuery(params)}`, { accessToken })
const createPaymentRequest = (payload, accessToken) => apiPost(BILLING_ENDPOINTS.payments, payload, { accessToken })
const patchPaymentRequest = (paymentId, payload, accessToken) => apiPatch(`${BILLING_ENDPOINTS.payments}${paymentId}/`, payload, { accessToken })

const listPaymentReceiptsRequest = (accessToken, params = {}) =>
  apiGet(`${BILLING_ENDPOINTS.paymentReceipts}${buildQuery(params)}`, { accessToken })

const createPaymentReceiptRequest = (payload, accessToken) => {
  const formData = new FormData()
  formData.append('payment', String(payload.payment))
  formData.append('file', payload.file)
  formData.append('original_name', payload.original_name || payload.file?.name || 'comprobante')

  if (payload.user) {
    formData.append('user', String(payload.user))
  }

  return apiPostForm(BILLING_ENDPOINTS.paymentReceipts, formData, { accessToken })
}

const listUsersRequest = (accessToken) => apiGet(BILLING_ENDPOINTS.users, { accessToken })

// --- NUEVAS FUNCIONES DE MEDIDORES ---
const listMeterReadingsRequest = (accessToken, params = {}) => apiGet(`${BILLING_ENDPOINTS.meterReadings}${buildQuery(params)}`, { accessToken })
const createMeterReadingRequest = (payload, accessToken) => apiPost(BILLING_ENDPOINTS.meterReadings, payload, { accessToken })

const closeBillingPeriodRequest = (periodId, accessToken) => 
  apiPost(`${BILLING_ENDPOINTS.billingPeriods}${periodId}/close-period/`, {}, { accessToken })

const createBillingPeriodRequest = (payload, accessToken) => 
  apiPost(BILLING_ENDPOINTS.billingPeriods, payload, { accessToken })

export {
  BILLING_ENDPOINTS,
  createPaymentReceiptRequest,
  createPaymentRequest,
  createCommonSpaceRequest,
  createCondominiumRequest,
  createResidentAssignmentRequest,
  createUnitRequest,
  deleteResidentAssignmentRequest,
  listBillingPeriodsRequest,
  listCommonExpensesRequest,
  listCommonSpacesRequest,
  listCondominiumsRequest,
  listPaymentReceiptsRequest,
  listPaymentsRequest,
  listResidentAssignmentsRequest,
  listUnitsRequest,
  listUsersRequest,
  patchPaymentRequest,
  listMeterReadingsRequest,
  createMeterReadingRequest,
  closeBillingPeriodRequest,
  createBillingPeriodRequest,
}