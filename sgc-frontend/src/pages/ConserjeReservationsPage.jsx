import { useCallback, useEffect, useMemo, useState } from 'react'
import DashboardLayout from '@shared/ui/DashboardLayout'
import DataTable from '@shared/ui/DataTable'
import useAuth from '@features/auth/hooks/useAuth'
import { conserjeNavItems } from '@features/conserje-dashboard/data/conserjeDashboardData'
import { listReservationsRequest } from '@entities/reservation/api/reservation.api'
import { mapReservationToRow, toReservationStatusBadge } from '@entities/reservation/model/reservation.mapper'

const ConserjeReservationsPage = () => {
  const { user, accessToken } = useAuth()
  const realName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Conserjeria'

  const [reservations, setReservations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReservations = useCallback(async () => {
    if (!accessToken) return

    setIsLoading(true)
    setError('')

    try {
      const response = await listReservationsRequest(accessToken)
      setReservations(Array.isArray(response) ? response.map(mapReservationToRow) : [])
    } catch (loadError) {
      setError(loadError.message || 'No fue posible cargar las reservas.')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    loadReservations()
  }, [loadReservations])

  const pendingReservations = useMemo(
    () => reservations.filter((reservation) => reservation.status === 'pending'),
    [reservations],
  )

  const historyReservations = useMemo(
    () => reservations.filter((reservation) => reservation.status !== 'pending'),
    [reservations],
  )

  const reservationColumns = [
    { header: 'Residente', accessor: 'requesterName' },
    { header: 'Rol', accessor: (row) => <span className="capitalize">{row.requesterRole}</span> },
    { header: 'Espacio', accessor: 'commonSpaceLabel' },
    {
      header: 'Fecha y hora',
      accessor: (row) => (
        <div>
          <p className="m-0 font-semibold text-stone-800">{row.reservationDate}</p>
          <p className="m-0 text-xs text-stone-500">{row.summary}</p>
        </div>
      ),
    },
    {
      header: 'Estado',
      accessor: (row) => (
        <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${toReservationStatusBadge(row.status)}`}>
          {row.statusLabel}
        </span>
      ),
    },
  ]

  const historyColumns = [
    { header: 'Residente', accessor: 'requesterName' },
    { header: 'Espacio', accessor: 'commonSpaceLabel' },
    {
      header: 'Agenda',
      accessor: (row) => (
        <div>
          <p className="m-0 font-semibold text-stone-800">{row.reservationDate}</p>
          <p className="m-0 text-xs text-stone-500">{row.summary}</p>
        </div>
      ),
    },
    {
      header: 'Estado',
      accessor: (row) => (
        <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${toReservationStatusBadge(row.status)}`}>
          {row.statusLabel}
        </span>
      ),
    },
  ]

  return (
    <DashboardLayout userRole="Conserjeria" userName={realName} title="Reservas (solo lectura)" navItems={conserjeNavItems}>
      <div className="mx-auto max-w-6xl space-y-8 pb-12">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-stone-900">Solicitudes de Espacios Comunes</h2>
            <p className="mt-1 text-stone-500">Vista operativa de reservas para conserjeria. Solo lectura.</p>
          </div>
          <button type="button" onClick={loadReservations} className="btn-secondary">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M16.5 10.5h4.5V6m0 4.5A7.5 7.5 0 106.3 18"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
              />
            </svg>
            Actualizar
          </button>
        </header>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex rounded-md bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
              {pendingReservations.length}
            </span>
            <h3 className="m-0 text-lg font-bold text-stone-900">Pendientes de revision</h3>
          </div>
          <DataTable
            columns={reservationColumns}
            data={pendingReservations}
            isLoading={isLoading}
            emptyMessage="No hay solicitudes pendientes."
            rowKey="id"
            title="Solicitudes pendientes"
          />
        </section>

        <section className="space-y-3">
          <h3 className="m-0 text-lg font-bold text-stone-900">Historial y agenda</h3>
          <DataTable
            columns={historyColumns}
            data={historyReservations}
            isLoading={isLoading}
            emptyMessage="No hay registros historicos."
            rowKey="id"
            title="Historial de reservas"
          />
        </section>
      </div>
    </DashboardLayout>
  )
}

export default ConserjeReservationsPage
