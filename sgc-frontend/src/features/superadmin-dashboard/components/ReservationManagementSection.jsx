import { useCallback, useEffect, useMemo, useState } from 'react'
import FormInput from '@shared/ui/FormInput'
import useAuth from '@features/auth/hooks/useAuth'
import {
  commonSpaceFieldConfig,
  commonSpaceOptions,
  emptyReservationForm,
  reservationFieldType,
  reservationStatusOptions,
} from '@entities/reservation/model/reservation.model'
import {
  mapFormToReservationPayload,
  mapReservationToFormValues,
  toReservationStatusBadge,
} from '@entities/reservation/model/reservation.mapper'
import {
  createReservation,
  deleteReservation,
  listReservations,
  updateReservation,
} from '../services/reservationManagement.service'

const roleOptions = [
  { value: 'residente', label: 'Residente' },
  { value: 'admin', label: 'Administrador' },
]

const ReservationManagementSection = () => {
  const { accessToken } = useAuth()
  const [reservations, setReservations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [formData, setFormData] = useState(emptyReservationForm)
  const [searchTerm, setSearchTerm] = useState('')
  const [spaceFilter, setSpaceFilter] = useState('all')
  const [isSaving, setIsSaving] = useState(false)

  const dynamicFields = useMemo(() => {
    return commonSpaceFieldConfig[formData.commonSpace] || []
  }, [formData.commonSpace])

  const submitLabel = useMemo(() => {
    if (isSaving) {
      return modalMode === 'create' ? 'Creando reserva...' : 'Guardando cambios...'
    }

    return modalMode === 'create' ? 'Crear reserva' : 'Guardar cambios'
  }, [isSaving, modalMode])

  const loadReservations = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const rows = await listReservations(accessToken)
      setReservations(rows)
    } catch (loadError) {
      setError(loadError.message || 'No fue posible cargar las reservas.')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (accessToken) {
      loadReservations()
    }
  }, [accessToken, loadReservations])

  const resetForm = () => {
    setFormData(emptyReservationForm)
    setError('')
  }

  const openCreateModal = () => {
    setModalMode('create')
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (reservation) => {
    setModalMode('edit')
    setFormData(mapReservationToFormValues(reservation, emptyReservationForm))
    setError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    resetForm()
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  const validateForm = () => {
    if (!formData.requesterName.trim()) {
      return 'Debes indicar quien solicita la reserva.'
    }

    if (!formData.reservationDate || !formData.startTime || !formData.endTime) {
      return 'Completa la fecha y el rango horario de la reserva.'
    }

    if (formData.startTime >= formData.endTime) {
      return 'La hora de termino debe ser mayor que la hora de inicio.'
    }

    const hasEmptyDynamicField = dynamicFields.some((field) => !String(formData[field.name] || '').trim())
    if (hasEmptyDynamicField) {
      return 'Completa los campos requeridos para el espacio comun seleccionado.'
    }

    return ''
  }

  const handleSaveReservation = async (event) => {
    event.preventDefault()
    const validationError = validateForm()

    if (validationError) {
      setError(validationError)
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const payload = mapFormToReservationPayload(formData, dynamicFields)

      if (modalMode === 'create') {
        await createReservation(payload, accessToken)
      } else {
        await updateReservation(formData.id, payload, accessToken)
      }

      closeModal()
      await loadReservations()
    } catch (saveError) {
      setError(saveError.message || 'No fue posible guardar la reserva.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteReservation = async (reservationId) => {
    const confirmation = window.confirm('Seguro que deseas eliminar esta reserva?')

    if (!confirmation) {
      return
    }

    try {
      await deleteReservation(reservationId, accessToken)
      await loadReservations()
    } catch (deleteError) {
      setError(deleteError.message || 'No fue posible eliminar la reserva.')
    }
  }

  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      const normalizedSearch = searchTerm.trim().toLowerCase()
      const matchesSearch =
        !normalizedSearch ||
        reservation.requesterName.toLowerCase().includes(normalizedSearch) ||
        reservation.commonSpaceLabel.toLowerCase().includes(normalizedSearch) ||
        reservation.statusLabel.toLowerCase().includes(normalizedSearch)

      const matchesSpace = spaceFilter === 'all' || reservation.commonSpace === spaceFilter

      return matchesSearch && matchesSpace
    })
  }, [reservations, searchTerm, spaceFilter])

  const renderDynamicField = (field) => {
    if (field.type === reservationFieldType.textarea) {
      return (
        <div key={field.name} className="flex flex-col gap-1.5">
          <label htmlFor={field.name} className="text-sm font-semibold text-stone-700">
            {field.label}
          </label>
          <textarea
            id={field.name}
            name={field.name}
            value={formData[field.name]}
            onChange={handleChange}
            rows={3}
            placeholder={field.placeholder || ''}
            className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-stone-900 outline-none transition-all focus:border-amber-600 focus:ring-2 focus:ring-amber-500/30"
          />
        </div>
      )
    }

    if (field.type === reservationFieldType.select) {
      return (
        <div key={field.name} className="flex flex-col gap-1.5">
          <label htmlFor={field.name} className="text-sm font-semibold text-stone-700">
            {field.label}
          </label>
          <select
            id={field.name}
            name={field.name}
            value={formData[field.name]}
            onChange={handleChange}
            className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-stone-900 outline-none transition-all focus:border-amber-600 focus:ring-2 focus:ring-amber-500/30"
          >
            <option value="">Selecciona una opcion</option>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )
    }

    return (
      <FormInput
        key={field.name}
        id={field.name}
        label={field.label}
        name={field.name}
        type={field.type}
        value={formData[field.name]}
        onChange={handleChange}
        placeholder={field.placeholder || ''}
        required
      />
    )
  }

  return (
    <section className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden relative">
      <div className="px-6 py-5 border-b border-stone-200 flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-stone-50">
        <div>
          <h3 className="text-lg font-bold text-stone-800">Gestión de reservas</h3>
          <p className="text-sm text-stone-500">Administra reservas de piscina, sala multiuso y gimnasio.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
        >
          + Nueva reserva
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_220px] gap-4 px-6 py-4 border-b border-stone-200">
        <input
          type="text"
          placeholder="Buscar por solicitante, espacio o estado..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="w-full rounded-lg border border-stone-300 px-4 py-2 text-sm outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
        />

        <select
          value={spaceFilter}
          onChange={(event) => setSpaceFilter(event.target.value)}
          className="w-full rounded-lg border border-stone-300 px-4 py-2 text-sm outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
        >
          <option value="all">Todos los espacios</option>
          {commonSpaceOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {!isModalOpen && error && (
        <div className="p-4 pb-0">
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-100/60 text-stone-500 text-xs uppercase tracking-wider border-b border-stone-200">
              <th className="px-6 py-4 font-semibold">Espacio</th>
              <th className="px-6 py-4 font-semibold">Solicitante</th>
              <th className="px-6 py-4 font-semibold">Fecha</th>
              <th className="px-6 py-4 font-semibold">Horario</th>
              <th className="px-6 py-4 font-semibold">Estado</th>
              <th className="px-6 py-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-stone-500">
                  Cargando reservas...
                </td>
              </tr>
            ) : filteredReservations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-stone-500">
                  No hay reservas que coincidan con los filtros actuales.
                </td>
              </tr>
            ) : (
              filteredReservations.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-stone-900">{reservation.commonSpaceLabel}</div>
                    <div className="text-xs text-stone-500 capitalize">{reservation.requesterRole}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-700">{reservation.requesterName}</td>
                  <td className="px-6 py-4 text-sm text-stone-700">{reservation.reservationDate}</td>
                  <td className="px-6 py-4 text-sm text-stone-700">{reservation.summary}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${toReservationStatusBadge(reservation.status)}`}>
                      {reservation.statusLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(reservation)}
                        className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 transition-colors hover:border-amber-500 hover:text-amber-700"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteReservation(reservation.id)}
                        className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-950/45 px-4 py-10">
          <div className="w-full max-w-3xl rounded-2xl border border-stone-200 bg-white shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-5">
              <div>
                <h4 className="text-xl font-bold text-stone-900">
                  {modalMode === 'create' ? 'Nueva reserva' : 'Editar reserva'}
                </h4>
                <p className="mt-1 text-sm text-stone-500">
                  El formulario se adapta automaticamente al espacio comun seleccionado.
                </p>
              </div>
              <button
                onClick={closeModal}
                className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-50"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSaveReservation} className="space-y-6 px-6 py-6">
              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">{error}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="commonSpace" className="text-sm font-semibold text-stone-700">
                    Espacio comun
                  </label>
                  <select
                    id="commonSpace"
                    name="commonSpace"
                    value={formData.commonSpace}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-stone-900 outline-none transition-all focus:border-amber-600 focus:ring-2 focus:ring-amber-500/30"
                  >
                    {commonSpaceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="requesterRole" className="text-sm font-semibold text-stone-700">
                    Perfil solicitante
                  </label>
                  <select
                    id="requesterRole"
                    name="requesterRole"
                    value={formData.requesterRole}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-stone-900 outline-none transition-all focus:border-amber-600 focus:ring-2 focus:ring-amber-500/30"
                  >
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <FormInput
                  id="requesterName"
                  label="Nombre solicitante"
                  name="requesterName"
                  value={formData.requesterName}
                  onChange={handleChange}
                  placeholder="Ej. Daniela Soto"
                  required
                />

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="status" className="text-sm font-semibold text-stone-700">
                    Estado
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-stone-900 outline-none transition-all focus:border-amber-600 focus:ring-2 focus:ring-amber-500/30"
                  >
                    {reservationStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <FormInput
                  id="reservationDate"
                  label="Fecha de reserva"
                  name="reservationDate"
                  type="date"
                  value={formData.reservationDate}
                  onChange={handleChange}
                  required
                />
                <FormInput
                  id="startTime"
                  label="Hora de inicio"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                />
                <FormInput
                  id="endTime"
                  label="Hora de termino"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-5">
                <h5 className="text-sm font-bold uppercase tracking-wide text-stone-700">Campos adaptativos del espacio</h5>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5">
                  {dynamicFields.map(renderDynamicField)}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="notes" className="text-sm font-semibold text-stone-700">
                  Observaciones
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Comentarios administrativos, instrucciones especiales o contexto de la reserva."
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-stone-900 outline-none transition-all focus:border-amber-600 focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-stone-200 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-bold text-stone-50 transition-colors hover:bg-stone-800 disabled:opacity-60"
                >
                  {submitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default ReservationManagementSection
