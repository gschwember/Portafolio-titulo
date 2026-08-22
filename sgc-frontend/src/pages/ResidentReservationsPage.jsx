import { useCallback, useEffect, useMemo, useState } from 'react'
import DashboardLayout from '@shared/ui/DashboardLayout'
import DataTable from '@shared/ui/DataTable'
import useAuth from '@features/auth/hooks/useAuth'
import { residentNavItems } from '@features/resident-dashboard/data/dashboardData'
import {
  createReservationRequest,
  listCommonSpacesRequest,
  listReservationsRequest,
} from '@entities/reservation/api/reservation.api'
import { mapReservationToRow, toReservationStatusBadge } from '@entities/reservation/model/reservation.mapper'

const timeSlotOptions = [
  { value: '10:00|14:00', label: 'Manana (10:00 - 14:00)' },
  { value: '15:00|19:00', label: 'Tarde (15:00 - 19:00)' },
  { value: '19:00|23:00', label: 'Noche (19:00 - 23:00)' },
]

const ResidentReservationsPage = () => {
  const { user, accessToken } = useAuth()
  const realName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Residente'

  const [commonSpaces, setCommonSpaces] = useState([])
  const [reservations, setReservations] = useState([])
  const [hasDebt] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    spaceCode: '',
    date: '',
    timeSlot: timeSlotOptions[0].value,
    notes: '',
  })

  const loadData = useCallback(async () => {
    if (!accessToken) return

    setIsLoading(true)
    setError('')

    try {
      const [spacesResponse, reservationsResponse] = await Promise.all([
        listCommonSpacesRequest(accessToken),
        listReservationsRequest(accessToken),
      ])

      setCommonSpaces(Array.isArray(spacesResponse) ? spacesResponse : [])
      setReservations(Array.isArray(reservationsResponse) ? reservationsResponse.map(mapReservationToRow) : [])
    } catch (loadError) {
      setError(loadError.message || 'No fue posible cargar las reservas.')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    loadData()
  }, [loadData])

  const canSubmit = useMemo(() => {
    return Boolean(formData.spaceCode && formData.date && formData.timeSlot && !hasDebt)
  }, [formData, hasDebt])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canSubmit) return

    const [startTime, endTime] = formData.timeSlot.split('|')
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const createdReservation = await createReservationRequest(
        {
          common_space: formData.spaceCode,
          requester_name: realName,
          requester_role: 'residente',
          reservation_date: formData.date,
          start_time: startTime,
          end_time: endTime,
          status: 'pending',
          notes: formData.notes.trim(),
          extra_data: {},
        },
        accessToken,
      )

      setReservations((previous) => [mapReservationToRow(createdReservation), ...previous])
      setFormData({
        spaceCode: '',
        date: '',
        timeSlot: timeSlotOptions[0].value,
        notes: '',
      })
      setSuccess('Solicitud enviada correctamente. Quedara pendiente de revision.')
    } catch (submitError) {
      setError(submitError.message || 'No fue posible crear la reserva.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const reservationColumns = [
    { header: 'Espacio', accessor: 'commonSpaceLabel' },
    { header: 'Fecha', accessor: 'reservationDate' },
    { header: 'Horario', accessor: 'summary' },
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
    <DashboardLayout userRole="Residente" userName={realName} title="Mis Reservas" navItems={residentNavItems}>
      <div className="mx-auto max-w-5xl space-y-8 pb-12">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Reserva de Espacios Comunes</h2>
          <p className="mt-1 text-stone-500">Solicita quinchos, canchas y salas de eventos.</p>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
        {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{success}</div>}

        {hasDebt ? (
          <div className="rounded-r-xl border-l-4 border-red-500 bg-red-50 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-red-800">Servicio suspendido por deuda</h3>
            <p className="mt-1 text-red-600">Debes regularizar tus pagos para crear nuevas reservas.</p>
          </div>
        ) : (
          <section className="surface-panel-soft overflow-hidden animate-fade-in-up">
            <div className="border-b border-stone-200 bg-stone-50 px-6 py-4">
              <h3 className="m-0 font-bold text-stone-800">Nueva solicitud</h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-stone-700">Espacio</label>
                  <select
                    required
                    value={formData.spaceCode}
                    onChange={(event) => setFormData((previous) => ({ ...previous, spaceCode: event.target.value }))}
                    className="input-base"
                  >
                    <option value="">Selecciona...</option>
                    {commonSpaces.map((space) => (
                      <option key={space.id} value={space.code}>
                        {space.name} (Max: {space.capacity} pax)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-stone-700">Fecha</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.date}
                    onChange={(event) => setFormData((previous) => ({ ...previous, date: event.target.value }))}
                    className="input-base"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-stone-700">Bloque horario</label>
                  <select
                    required
                    value={formData.timeSlot}
                    onChange={(event) => setFormData((previous) => ({ ...previous, timeSlot: event.target.value }))}
                    className="input-base"
                  >
                    {timeSlotOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-stone-700">Observaciones</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(event) => setFormData((previous) => ({ ...previous, notes: event.target.value }))}
                    className="input-base"
                    placeholder="Opcional"
                  />
                </div>

                <div className="md:col-span-2">
                  <button type="submit" disabled={isSubmitting || !canSubmit} className="btn-primary w-full bg-amber-600 hover:bg-amber-700">
                    {isSubmitting ? 'Procesando...' : 'Solicitar reserva'}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-stone-900">Mis solicitudes anteriores</h3>
          <DataTable
            columns={reservationColumns}
            data={reservations}
            isLoading={isLoading}
            emptyMessage="No tienes reservas registradas."
            rowKey="id"
            title="Historial de reservas"
          />
        </section>
      </div>
    </DashboardLayout>
  )
}

export default ResidentReservationsPage
