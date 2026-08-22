import { APP_ROUTES } from '@app/routes'
import { mapResident, residentMockList } from '@entities/resident/model/resident.model'
import { paymentStatus } from '../../payments/model/payment.model'

// Items de menu para el rol "Residente".
export const residentNavItems = [
  {
    label: 'Mi Perfil',
    to: APP_ROUTES.residentDashboard,
  },
  {
    label: 'Pagos',
    to: APP_ROUTES.residentPayments,
  },
  { 
    label: 'Reservas', 
    to: APP_ROUTES.residentReservations,
  },
]

// Mock transformado desde la capa de entidad.
export const residentProfiles = residentMockList.map(mapResident)

const statusStyles = {
  [paymentStatus.approved]: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  [paymentStatus.pending]: 'bg-amber-100 text-amber-800 border border-amber-200',
  [paymentStatus.rejected]: 'bg-rose-100 text-rose-800 border border-rose-200',
}

// Columnas declarativas para DataTable (facil de reemplazar por payload de API).
export const paymentHistoryColumns = [
  { header: 'Período', accessor: 'periodo' },
  { header: 'Fecha de pago', accessor: 'fecha' },
  { header: 'Monto total', accessor: 'monto' },
  {
    header: 'Estado',
    accessor: (row) => {
      const className = statusStyles[row.estado] ?? 'bg-stone-100 text-stone-700 border border-stone-200'
      return (
        <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${className}`}>
          {row.estado}
        </span>
      )
    },
  },
  { header: 'Comprobante', accessor: 'comprobante' },
]
