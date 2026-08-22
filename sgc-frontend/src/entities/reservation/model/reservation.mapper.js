import {
  commonSpaceOptions,
  reservationStatus,
  reservationStatusOptions,
} from './reservation.model'

const commonSpaceLabelMap = commonSpaceOptions.reduce((accumulator, option) => {
  accumulator[option.value] = option.label
  return accumulator
}, {})

const reservationStatusLabelMap = reservationStatusOptions.reduce((accumulator, option) => {
  accumulator[option.value] = option.label
  return accumulator
}, {})

const reservationStatusBadgeMap = {
  [reservationStatus.pending]: 'bg-amber-100 text-amber-800 border border-amber-200',
  [reservationStatus.approved]: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  [reservationStatus.rejected]: 'bg-rose-100 text-rose-800 border border-rose-200',
}

const toCommonSpaceLabel = (value) => commonSpaceLabelMap[value] || value
const toReservationStatusLabel = (value) => reservationStatusLabelMap[value] || value
const toReservationStatusBadge = (value) => reservationStatusBadgeMap[value] || 'bg-stone-100 text-stone-700 border border-stone-200'

const mapReservationToRow = (reservation) => {
  const extraData = reservation.extra_data || {}

  return {
    id: reservation.id,
    commonSpace: reservation.common_space,
    commonSpaceLabel: toCommonSpaceLabel(reservation.common_space),
    requesterName: reservation.requester_name,
    requesterRole: reservation.requester_role,
    reservationDate: reservation.reservation_date,
    startTime: reservation.start_time,
    endTime: reservation.end_time,
    status: reservation.status,
    statusLabel: toReservationStatusLabel(reservation.status),
    notes: reservation.notes || '',
    extraData,
    summary: `${reservation.start_time} - ${reservation.end_time}`,
  }
}

const mapFormToReservationPayload = (formData, dynamicFields) => {
  const extraData = dynamicFields.reduce((accumulator, field) => {
    accumulator[field.name] = formData[field.name] || ''
    return accumulator
  }, {})

  return {
    common_space: formData.commonSpace,
    requester_name: formData.requesterName.trim(),
    requester_role: formData.requesterRole,
    reservation_date: formData.reservationDate,
    start_time: formData.startTime,
    end_time: formData.endTime,
    status: formData.status,
    notes: formData.notes.trim(),
    extra_data: extraData,
  }
}

const mapReservationToFormValues = (reservation, emptyForm) => {
  return {
    ...emptyForm,
    id: reservation.id,
    commonSpace: reservation.commonSpace,
    requesterName: reservation.requesterName,
    requesterRole: reservation.requesterRole,
    reservationDate: reservation.reservationDate,
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    status: reservation.status,
    notes: reservation.notes,
    ...(reservation.extraData || {}),
  }
}

export {
  mapFormToReservationPayload,
  mapReservationToFormValues,
  mapReservationToRow,
  toCommonSpaceLabel,
  toReservationStatusBadge,
  toReservationStatusLabel,
}
