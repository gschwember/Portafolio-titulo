import {
  createReservationRequest,
  deleteReservationRequest,
  listReservationsRequest,
  updateReservationRequest,
} from '@entities/reservation/api/reservation.api'
import { mapReservationToRow } from '@entities/reservation/model/reservation.mapper'

const listReservations = async (accessToken) => {
  const rows = await listReservationsRequest(accessToken)
  return rows.map(mapReservationToRow)
}

const createReservation = async (payload, accessToken) => {
  const row = await createReservationRequest(payload, accessToken)
  return mapReservationToRow(row)
}

const updateReservation = async (reservationId, payload, accessToken) => {
  const row = await updateReservationRequest(reservationId, payload, accessToken)
  return mapReservationToRow(row)
}

const deleteReservation = async (reservationId, accessToken) => {
  await deleteReservationRequest(reservationId, accessToken)
}

export { createReservation, deleteReservation, listReservations, updateReservation }
