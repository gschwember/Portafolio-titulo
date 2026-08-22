const reservationStatus = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
}

const reservationStatusOptions = [
  { value: reservationStatus.pending, label: 'Pendiente' },
  { value: reservationStatus.approved, label: 'Aprobada' },
  { value: reservationStatus.rejected, label: 'Rechazada' },
]

const commonSpaceType = {
  pool: 'pool',
  multiUseRoom: 'multi_use_room',
  gym: 'gym',
}

const commonSpaceOptions = [
  { value: commonSpaceType.pool, label: 'Piscina' },
  { value: commonSpaceType.multiUseRoom, label: 'Sala multiuso' },
  { value: commonSpaceType.gym, label: 'Gimnasio' },
]

const reservationFieldType = {
  number: 'number',
  select: 'select',
  text: 'text',
  textarea: 'textarea',
}

const commonSpaceFieldConfig = {
  [commonSpaceType.pool]: [
    {
      name: 'guestCount',
      label: 'Cantidad de invitados',
      type: reservationFieldType.number,
      min: 1,
      max: 10,
      placeholder: 'Ej. 4',
    },
    {
      name: 'poolSlot',
      label: 'Bloque de uso',
      type: reservationFieldType.select,
      options: [
        { value: 'morning', label: 'Manana' },
        { value: 'afternoon', label: 'Tarde' },
        { value: 'full_day', label: 'Jornada completa' },
      ],
    },
  ],
  [commonSpaceType.multiUseRoom]: [
    {
      name: 'attendeeCount',
      label: 'Cantidad de asistentes',
      type: reservationFieldType.number,
      min: 1,
      max: 60,
      placeholder: 'Ej. 20',
    },
    {
      name: 'eventPurpose',
      label: 'Motivo del evento',
      type: reservationFieldType.text,
      placeholder: 'Ej. Reunion familiar',
    },
    {
      name: 'supportNotes',
      label: 'Requerimientos especiales',
      type: reservationFieldType.textarea,
      placeholder: 'Ej. Mesas adicionales, limpieza extra, proyector.',
    },
  ],
  [commonSpaceType.gym]: [
    {
      name: 'trainingType',
      label: 'Tipo de entrenamiento',
      type: reservationFieldType.select,
      options: [
        { value: 'cardio', label: 'Cardio' },
        { value: 'strength', label: 'Fuerza' },
        { value: 'functional', label: 'Funcional' },
      ],
    },
    {
      name: 'participantCount',
      label: 'Cantidad de participantes',
      type: reservationFieldType.number,
      min: 1,
      max: 8,
      placeholder: 'Ej. 2',
    },
  ],
}

const createDynamicFields = () => {
  return Object.values(commonSpaceFieldConfig).flat().reduce((accumulator, field) => {
    accumulator[field.name] = ''
    return accumulator
  }, {})
}

const emptyReservationForm = {
  id: null,
  commonSpace: commonSpaceType.pool,
  requesterName: '',
  requesterRole: 'residente',
  reservationDate: '',
  startTime: '',
  endTime: '',
  status: reservationStatus.pending,
  notes: '',
  ...createDynamicFields(),
}

export {
  commonSpaceFieldConfig,
  commonSpaceOptions,
  commonSpaceType,
  emptyReservationForm,
  reservationFieldType,
  reservationStatus,
  reservationStatusOptions,
}
