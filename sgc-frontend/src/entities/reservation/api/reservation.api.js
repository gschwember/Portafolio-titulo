import { apiDelete, apiGet, apiPatch, apiPost } from '@shared/api/client'

const RESERVATION_ENDPOINTS = {
  base: '/v1/reservations/',
  commonSpaces: '/v1/reservations/common-spaces/',
}

const listReservationsRequest = async (accessToken) => {
  return apiGet(RESERVATION_ENDPOINTS.base, { accessToken })
}

const createReservationRequest = async (payload, accessToken) => {
  return apiPost(RESERVATION_ENDPOINTS.base, payload, { accessToken })
}

const updateReservationRequest = async (reservationId, payload, accessToken) => {
  return apiPatch(`${RESERVATION_ENDPOINTS.base}${reservationId}`, payload, { accessToken })
}

const deleteReservationRequest = async (reservationId, accessToken) => {
  return apiDelete(`${RESERVATION_ENDPOINTS.base}${reservationId}`, { accessToken })
}

const listCommonSpacesRequest = async (accessToken) => {
  return apiGet(RESERVATION_ENDPOINTS.commonSpaces, { accessToken })
}

export {
  createReservationRequest,
  deleteReservationRequest,
  listCommonSpacesRequest,
  listReservationsRequest,
  RESERVATION_ENDPOINTS,
  updateReservationRequest,
}
