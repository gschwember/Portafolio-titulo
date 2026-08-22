import { useCallback, useEffect, useMemo, useState } from 'react'
import useAuth from '@features/auth/hooks/useAuth'
import GoogleMapPicker from '@shared/ui/GoogleMapPicker'
import useCondominium from '../hooks/useCondominium'
import {
  createCommonSpaceRequest,
  createCondominiumRequest,
  createResidentAssignmentRequest,
  createUnitRequest,
  deleteResidentAssignmentRequest,
  listCommonSpacesRequest,
  listResidentAssignmentsRequest,
  listUnitsRequest,
  listUsersRequest,
} from '../api/billing.api'

const initialCondominiumForm = { name: '', address: '', city: '', latitude: '', longitude: '' }
const initialUnitForm = { number: '', floor: '', proration_factor: '1.0000' }
const initialAssignmentForm = { user: '', unit: '', start_date: '', is_owner: false, is_primary: true, is_active: true }
const initialCommonSpaceForm = { name: '', space_type: '', block_duration: 60, is_active: true }

const CondominiumManagementSection = () => {
  const { accessToken } = useAuth()
  const {
    condominiums,
    activeCondominiumId,
    activeCondominium,
    isLoading,
    setActiveCondominium,
    reloadCondominiums,
  } = useCondominium()

  const [units, setUnits] = useState([])
  const [assignments, setAssignments] = useState([])
  const [commonSpaces, setCommonSpaces] = useState([])
  const [residentUsers, setResidentUsers] = useState([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState('')

  const [condominiumForm, setCondominiumForm] = useState(initialCondominiumForm)
  const [unitForm, setUnitForm] = useState(initialUnitForm)
  const [assignmentForm, setAssignmentForm] = useState(initialAssignmentForm)
  const [commonSpaceForm, setCommonSpaceForm] = useState(initialCommonSpaceForm)

  const [isSavingCondominium, setIsSavingCondominium] = useState(false)
  const [isSavingUnit, setIsSavingUnit] = useState(false)
  const [isSavingAssignment, setIsSavingAssignment] = useState(false)
  const [isSavingCommonSpace, setIsSavingCommonSpace] = useState(false)
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

  const filteredUnits = useMemo(() => {
    if (!activeCondominiumId) {
      return []
    }
    return units.filter((unit) => unit.condominium === activeCondominiumId)
  }, [units, activeCondominiumId])

  const filteredAssignments = useMemo(() => {
    if (!activeCondominiumId) {
      return []
    }

    const unitIdSet = new Set(filteredUnits.map((unit) => unit.id))
    return assignments.filter((assignment) => unitIdSet.has(assignment.unit))
  }, [assignments, filteredUnits, activeCondominiumId])

  const filteredCommonSpaces = useMemo(() => {
    if (!activeCondominiumId) {
      return []
    }
    return commonSpaces.filter((space) => space.condominium === activeCondominiumId)
  }, [commonSpaces, activeCondominiumId])

  const residentOptions = useMemo(() => {
    return residentUsers
      .filter((user) => user.role === 'residente')
      .map((user) => ({
        id: user.id,
        label: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        email: user.email,
      }))
  }, [residentUsers])

  const loadDetails = useCallback(async () => {
    if (!accessToken) {
      return
    }

    setLoadingDetail(true)
    setError('')
    try {
      const [unitsRows, assignmentsRows, spacesRows] = await Promise.all([
        listUnitsRequest(accessToken),
        listResidentAssignmentsRequest(accessToken),
        listCommonSpacesRequest(accessToken),
      ])

      setUnits(Array.isArray(unitsRows) ? unitsRows : [])
      setAssignments(Array.isArray(assignmentsRows) ? assignmentsRows : [])
      setCommonSpaces(Array.isArray(spacesRows) ? spacesRows : [])

      try {
        const usersRows = await listUsersRequest(accessToken)
        setResidentUsers(Array.isArray(usersRows) ? usersRows : [])
      } catch {
        setResidentUsers([])
      }
    } catch (requestError) {
      setError(requestError.message || 'No fue posible cargar la gestión de condominio.')
    } finally {
      setLoadingDetail(false)
    }
  }, [accessToken])

  useEffect(() => {
    loadDetails()
  }, [loadDetails])

  useEffect(() => {
    if (activeCondominiumId) {
      setAssignmentForm((prev) => ({ ...prev, unit: '' }))
    }
  }, [activeCondominiumId])

  const onCreateCondominium = async (event) => {
    event.preventDefault()
    setIsSavingCondominium(true)
    setError('')

    try {
      const created = await createCondominiumRequest(
        {
          ...condominiumForm,
          latitude: condominiumForm.latitude === '' ? null : Number(condominiumForm.latitude),
          longitude: condominiumForm.longitude === '' ? null : Number(condominiumForm.longitude),
        },
        accessToken,
      )
      setCondominiumForm(initialCondominiumForm)
      await reloadCondominiums()
      if (created?.id) {
        setActiveCondominium(created.id)
      }
    } catch (submitError) {
      setError(submitError.message || 'No se pudo crear el condominio.')
    } finally {
      setIsSavingCondominium(false)
    }
  }

  const onCreateUnit = async (event) => {
    event.preventDefault()
    if (!activeCondominiumId) {
      setError('Selecciona un condominio antes de crear unidades.')
      return
    }

    setIsSavingUnit(true)
    setError('')

    try {
      await createUnitRequest(
        {
          condominium: activeCondominiumId,
          number: unitForm.number,
          floor: unitForm.floor === '' ? null : Number(unitForm.floor),
          proration_factor: unitForm.proration_factor,
          is_active: true,
        },
        accessToken,
      )
      setUnitForm(initialUnitForm)
      await loadDetails()
    } catch (submitError) {
      setError(submitError.message || 'No se pudo crear la unidad.')
    } finally {
      setIsSavingUnit(false)
    }
  }

  const onCreateAssignment = async (event) => {
    event.preventDefault()
    setIsSavingAssignment(true)
    setError('')

    try {
      await createResidentAssignmentRequest(
        {
          user: Number(assignmentForm.user),
          unit: Number(assignmentForm.unit),
          start_date: assignmentForm.start_date,
          end_date: null,
          is_owner: assignmentForm.is_owner,
          is_primary: assignmentForm.is_primary,
          is_active: assignmentForm.is_active,
        },
        accessToken,
      )
      setAssignmentForm(initialAssignmentForm)
      await loadDetails()
    } catch (submitError) {
      setError(submitError.message || 'No se pudo crear la asignacion.')
    } finally {
      setIsSavingAssignment(false)
    }
  }

  const onDeleteAssignment = async (assignmentId) => {
    const confirmed = window.confirm('Se eliminara esta asignacion. Deseas continuar?')
    if (!confirmed) {
      return
    }

    try {
      await deleteResidentAssignmentRequest(assignmentId, accessToken)
      await loadDetails()
    } catch (requestError) {
      setError(requestError.message || 'No se pudo eliminar la asignacion.')
    }
  }

  const onCreateCommonSpace = async (event) => {
    event.preventDefault()
    if (!activeCondominiumId) {
      setError('Selecciona un condominio antes de crear espacios comunes.')
      return
    }

    setIsSavingCommonSpace(true)
    setError('')

    try {
      await createCommonSpaceRequest(
        {
          condominium: activeCondominiumId,
          name: commonSpaceForm.name,
          space_type: commonSpaceForm.space_type,
          block_duration: Number(commonSpaceForm.block_duration),
          is_active: commonSpaceForm.is_active,
        },
        accessToken,
      )
      setCommonSpaceForm(initialCommonSpaceForm)
      await loadDetails()
    } catch (submitError) {
      setError(submitError.message || 'No se pudo crear el espacio comun.')
    } finally {
      setIsSavingCommonSpace(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-stone-900">Condominio activo</h3>
            <p className="text-sm text-stone-500">Este contexto se usara para unidades, asignaciones y espacios comunes.</p>
          </div>
          <button
            type="button"
            onClick={loadDetails}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
          >
            {loadingDetail || isLoading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>

        <select
          value={activeCondominiumId || ''}
          onChange={(event) => setActiveCondominium(event.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        >
          {!condominiums.length && <option value="">Sin condominios disponibles</option>}
          {condominiums.map((condominium) => (
            <option key={condominium.id} value={condominium.id}>
              {condominium.name}
            </option>
          ))}
        </select>

        {activeCondominium && (
          <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-3">
            <p className="mb-2 text-sm font-semibold text-stone-800">Ubicacion del condominio activo</p>
            <p className="mb-2 text-xs text-stone-600">
              {activeCondominium.address}
              {activeCondominium.city ? `, ${activeCondominium.city}` : ''}
            </p>
            <div className="mb-2 grid grid-cols-2 gap-2">
              <input value={activeCondominium.latitude ?? ''} readOnly className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs" />
              <input value={activeCondominium.longitude ?? ''} readOnly className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs" />
            </div>
            <GoogleMapPicker
              apiKey={googleMapsApiKey}
              latitude={activeCondominium.latitude}
              longitude={activeCondominium.longitude}
              addressQuery={`${activeCondominium.address || ''} ${activeCondominium.city || ''}`.trim()}
              readOnly
              heightClassName="h-56"
            />
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-stone-900">Crear condominio</h3>
          <p className="mb-4 text-sm text-stone-500">Administra varios condominios desde una sola plataforma.</p>
          <form className="space-y-3" onSubmit={onCreateCondominium}>
            <input
              value={condominiumForm.name}
              onChange={(event) => setCondominiumForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Nombre del condominio"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              required
            />
            <input
              value={condominiumForm.address}
              onChange={(event) => setCondominiumForm((prev) => ({ ...prev, address: event.target.value }))}
              placeholder="Direccion"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              required
            />
            <input
              value={condominiumForm.city}
              onChange={(event) => setCondominiumForm((prev) => ({ ...prev, city: event.target.value }))}
              placeholder="Ciudad"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
            <GoogleMapPicker
              apiKey={googleMapsApiKey}
              latitude={condominiumForm.latitude}
              longitude={condominiumForm.longitude}
              addressQuery={`${condominiumForm.address || ''} ${condominiumForm.city || ''}`.trim()}
              onLocationChange={({ lat, lng }) =>
                setCondominiumForm((prev) => ({ ...prev, latitude: String(lat), longitude: String(lng) }))
              }
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.0000001"
                value={condominiumForm.latitude}
                onChange={(event) => setCondominiumForm((prev) => ({ ...prev, latitude: event.target.value }))}
                placeholder="Latitud"
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                step="0.0000001"
                value={condominiumForm.longitude}
                onChange={(event) => setCondominiumForm((prev) => ({ ...prev, longitude: event.target.value }))}
                placeholder="Longitud"
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isSavingCondominium}
              className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
            >
              {isSavingCondominium ? 'Guardando...' : 'Crear condominio'}
            </button>
          </form>
        </article>

        <article className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-stone-900">Unidades de {activeCondominium?.name || 'condominio'}</h3>
          <p className="mb-4 text-sm text-stone-500">Cada unidad incluye piso y factor de prorrateo.</p>
          <form className="grid gap-3 sm:grid-cols-3" onSubmit={onCreateUnit}>
            <input
              value={unitForm.number}
              onChange={(event) => setUnitForm((prev) => ({ ...prev, number: event.target.value }))}
              placeholder="Unidad"
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
              required
            />
            <input
              type="number"
              value={unitForm.floor}
              onChange={(event) => setUnitForm((prev) => ({ ...prev, floor: event.target.value }))}
              placeholder="Piso"
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
            <input
              value={unitForm.proration_factor}
              onChange={(event) => setUnitForm((prev) => ({ ...prev, proration_factor: event.target.value }))}
              placeholder="Prorrateo"
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
              required
            />
            <button
              type="submit"
              disabled={isSavingUnit}
              className="sm:col-span-3 rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-50 hover:bg-stone-800 disabled:opacity-60"
            >
              {isSavingUnit ? 'Guardando...' : 'Agregar unidad'}
            </button>
          </form>

          <div className="mt-4 max-h-48 overflow-auto rounded-lg border border-stone-200">
            <table className="w-full text-sm">
              <thead className="bg-stone-100 text-left text-stone-700">
                <tr>
                  <th className="px-3 py-2">Unidad</th>
                  <th className="px-3 py-2">Piso</th>
                  <th className="px-3 py-2">Prorrateo</th>
                </tr>
              </thead>
              <tbody>
                {filteredUnits.map((unit) => (
                  <tr key={unit.id} className="border-t border-stone-200">
                    <td className="px-3 py-2">{unit.number}</td>
                    <td className="px-3 py-2">{unit.floor ?? '-'}</td>
                    <td className="px-3 py-2">{unit.proration_factor}</td>
                  </tr>
                ))}
                {!filteredUnits.length && (
                  <tr>
                    <td className="px-3 py-3 text-stone-500" colSpan={3}>
                      No hay unidades registradas para este condominio.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-stone-900">Asignar residente a unidad</h3>
          <p className="mb-4 text-sm text-stone-500">Controla residentes principales, propietarios y vigencia.</p>
          <form className="grid gap-3" onSubmit={onCreateAssignment}>
            {residentOptions.length ? (
              <select
                value={assignmentForm.user}
                onChange={(event) => setAssignmentForm((prev) => ({ ...prev, user: event.target.value }))}
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
                required
              >
                <option value="">Selecciona residente</option>
                {residentOptions.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.label} ({user.email})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                value={assignmentForm.user}
                onChange={(event) => setAssignmentForm((prev) => ({ ...prev, user: event.target.value }))}
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
                placeholder="ID de usuario residente"
                required
              />
            )}

            <select
              value={assignmentForm.unit}
              onChange={(event) => setAssignmentForm((prev) => ({ ...prev, unit: event.target.value }))}
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
              required
            >
              <option value="">Selecciona unidad</option>
              {filteredUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  Unidad {unit.number}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={assignmentForm.start_date}
              onChange={(event) => setAssignmentForm((prev) => ({ ...prev, start_date: event.target.value }))}
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
              required
            />

            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={assignmentForm.is_owner}
                onChange={(event) => setAssignmentForm((prev) => ({ ...prev, is_owner: event.target.checked }))}
              />
              Es propietario
            </label>
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={assignmentForm.is_primary}
                onChange={(event) => setAssignmentForm((prev) => ({ ...prev, is_primary: event.target.checked }))}
              />
              Es residente principal
            </label>


            <button
              type="submit"
              disabled={isSavingAssignment}
              className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-50 hover:bg-stone-800 disabled:opacity-60"
            >
              {isSavingAssignment ? 'Guardando...' : 'Asignar residente'}
            </button>
          </form>

          <div className="mt-4 max-h-52 overflow-auto rounded-lg border border-stone-200">
            <table className="w-full text-sm">
              <thead className="bg-stone-100 text-left text-stone-700">
                <tr>
                  <th className="px-3 py-2">Usuario</th>
                  <th className="px-3 py-2">Unidad</th>
                  <th className="px-3 py-2">Inicio</th>
                  <th className="px-3 py-2">Accion</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((assignment) => {

                  const userObj = residentUsers.find((u) => u.id === assignment.user)
                  const userName = userObj ? `${userObj.first_name || ''} ${userObj.last_name || ''}`.trim() || userObj.email : `Usuario #${assignment.user}`
                  

                  const unitObj = units.find((u) => u.id === assignment.unit)
                  const unitNumber = unitObj ? `Depto ${unitObj.number}` : `Unidad #${assignment.unit}`

                  return (
                    <tr key={assignment.id} className="border-t border-stone-200">
                      <td className="px-3 py-2 font-medium">{userName}</td>
                      <td className="px-3 py-2 text-stone-600">{unitNumber}</td>
                      <td className="px-3 py-2 text-stone-600">{assignment.start_date}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => onDeleteAssignment(assignment.id)}
                          className="text-xs font-semibold text-red-700 hover:text-red-900 hover:underline"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {!filteredAssignments.length && (
                  <tr>
                    <td className="px-3 py-3 text-stone-500" colSpan={4}>
                      No hay asignaciones para este condominio.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-stone-900">Espacios comunes</h3>
          <p className="mb-4 text-sm text-stone-500">Define piscina, quincho, gimnasio u otros espacios reservables.</p>
          <form className="grid gap-3" onSubmit={onCreateCommonSpace}>
            <input
              value={commonSpaceForm.name}
              onChange={(event) => setCommonSpaceForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Nombre del espacio"
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
              required
            />
            <input
              value={commonSpaceForm.space_type}
              onChange={(event) => setCommonSpaceForm((prev) => ({ ...prev, space_type: event.target.value }))}
              placeholder="Tipo (Piscina, Quincho, etc.)"
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
              required
            />
            <input
              type="number"
              min="15"
              value={commonSpaceForm.block_duration}
              onChange={(event) => setCommonSpaceForm((prev) => ({ ...prev, block_duration: event.target.value }))}
              placeholder="Duracion del bloque"
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
              required
            />
            <button
              type="submit"
              disabled={isSavingCommonSpace}
              className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-50 hover:bg-stone-800 disabled:opacity-60"
            >
              {isSavingCommonSpace ? 'Guardando...' : 'Crear espacio comun'}
            </button>
          </form>

          <ul className="mt-4 divide-y divide-stone-200 rounded-lg border border-stone-200 bg-stone-50">
            {filteredCommonSpaces.map((space) => (
              <li key={space.id} className="px-3 py-2 text-sm text-stone-700">
                <span className="font-semibold text-stone-900">{space.name}</span> - {space.space_type} ({space.block_duration} min)
              </li>
            ))}
            {!filteredCommonSpaces.length && <li className="px-3 py-3 text-sm text-stone-500">No hay espacios comunes registrados.</li>}
          </ul>
        </article>
      </section>
    </div>
  )
}

export default CondominiumManagementSection

