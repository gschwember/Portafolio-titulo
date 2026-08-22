import { APP_ROUTES } from '@app/routes'

// Menú lateral exclusivo para el Conserje
export const conserjeNavItems = [
  { 
    label: 'Mi Perfil', 
    to: APP_ROUTES.conserjeDashboard 
  },
  { 
    label: 'Lectura Medidores', 
    to: APP_ROUTES.conserjeMedidores 
  },
  { 
    label: 'Reservas', 
    to: APP_ROUTES.conserjeReservations,
  },
]

// Datos falsos de las lecturas que el conserje ya ingresó este mes
export const meterReadingsMock = [
  {
    id: 'lec-001',
    unit: '101',
    type: 'Agua Caliente',
    previousReading: 450,
    currentReading: 462,
    consumption: 12, // m3
    dateRecorded: '2026-03-25',
    status: 'registrado'
  },
  {
    id: 'lec-002',
    unit: '102',
    type: 'Agua Caliente',
    previousReading: 310,
    currentReading: 318,
    consumption: 8,
    dateRecorded: '2026-03-25',
    status: 'registrado'
  },
  {
    id: 'lec-003',
    unit: '201',
    type: 'Calefacción',
    previousReading: 1200,
    currentReading: 1250,
    consumption: 50, // kWh
    dateRecorded: '2026-03-26',
    status: 'registrado'
  }
]

export const readingTypes = [
  { value: 'Agua Caliente', label: 'Agua Caliente (m³)' },
  { value: 'Calefacción', label: 'Calefacción (kWh)' }
]