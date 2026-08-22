import { useState, useMemo, useEffect, useCallback } from 'react'
import useAuth from '@features/auth/hooks/useAuth'
import useCondominium from '@features/condominium-management/hooks/useCondominium'
import DataTable from '@shared/ui/DataTable'
// Importamos listMeterReadingsRequest para descargar la tabla real
import { listUnitsRequest, createMeterReadingRequest, listMeterReadingsRequest } from '@features/condominium-management/api/billing.api'
import { readingTypes } from '../data/conserjeDashboardData'

const IngresoMedidores = () => {
  const { accessToken } = useAuth()
  const { condominiums, activeCondominiumId, setActiveCondominium } = useCondominium()

  // 1. Empezamos con un array vacío en lugar de usar los Mocks
  const [rawReadings, setRawReadings] = useState([])
  const [units, setUnits] = useState([])
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [type, setType] = useState(readingTypes[0].value)
  const [currentReading, setCurrentReading] = useState('')

  const loadUnitsAndReadings = useCallback(async () => {
    if (!accessToken) return
    setLoadingUnits(true)
    setError('')

    try {
      // 2. Cargamos tanto las unidades como las lecturas reales al mismo tiempo
      const [unitsData, readingsData] = await Promise.all([
        listUnitsRequest(accessToken),
        listMeterReadingsRequest(accessToken)
      ])
      setUnits(Array.isArray(unitsData) ? unitsData : [])
      setRawReadings(Array.isArray(readingsData) ? readingsData : [])
    } catch (requestError) {
      setUnits([])
      setRawReadings([])
      setError(requestError.message || 'Error al cargar los datos del servidor.')
    } finally {
      setLoadingUnits(false)
    }
  }, [accessToken])

  useEffect(() => {
    loadUnitsAndReadings()
  }, [loadUnitsAndReadings])

  const availableUnits = useMemo(() => {
    if (!activeCondominiumId) return []
    return units.filter((unit) => String(unit.condominium) === String(activeCondominiumId))
  }, [units, activeCondominiumId])

  // 3. Filtramos y damos formato a las lecturas para que muestren "Depto XX" en vez del ID
  const displayReadings = useMemo(() => {
    if (!activeCondominiumId) return []
    
    // Filtramos solo las lecturas de las unidades de este edificio
    const condoReadings = rawReadings.filter(reading => 
      availableUnits.some(unit => String(unit.id) === String(reading.unit))
    )

    // Le agregamos la etiqueta bonita (Depto) a cada fila
    return condoReadings.map(reading => {
      const unitObj = availableUnits.find(u => String(u.id) === String(reading.unit))
      return {
        ...reading,
        unitLabel: unitObj?.number ? `Depto ${unitObj.number}` : `Unidad #${reading.unit}`,
        // Aseguramos que la primera letra del tipo sea mayúscula para que se vea mejor
        typeLabel: reading.type.charAt(0).toUpperCase() + reading.type.slice(1)
      }
    })
  }, [rawReadings, availableUnits, activeCondominiumId])

  useEffect(() => {
    setSelectedUnitId('')
  }, [activeCondominiumId])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!activeCondominiumId) {
      setError('Debes seleccionar un condominio antes de registrar lecturas.')
      return
    }

    if (!selectedUnitId || !currentReading) {
      setError('Completa la unidad y la lectura actual para continuar.')
      return
    }

    try {
      const payload = {
        unit: selectedUnitId,
        type: type,
        currentReading: Number(currentReading),
      }

      await createMeterReadingRequest(payload, accessToken)

      setSuccess('Lectura registrada correctamente en la base de datos.')
      setSelectedUnitId('')
      setCurrentReading('')
      
      // 4. Volvemos a pedir las lecturas al backend para que la tabla se actualice sola
      const updatedReadings = await listMeterReadingsRequest(accessToken)
      setRawReadings(Array.isArray(updatedReadings) ? updatedReadings : [])
      
    } catch (requestError) {
      setError(requestError.message || 'Error al guardar la lectura en el servidor.')
    }
  }

  // 5. Ajustamos las columnas para usar el unitLabel y typeLabel que creamos en el useMemo
  const readingColumns = [
    { header: 'Unidad', accessor: 'unitLabel' },
    { header: 'Servicio', accessor: 'typeLabel' },
    { header: 'Lectura anterior', accessor: 'previousReading' },
    { header: 'Lectura actual', accessor: (row) => <span className="font-bold text-emerald-700">{row.currentReading}</span> },
    { header: 'Consumo', accessor: (row) => <span className="font-bold text-amber-700">{row.consumption}</span> },
    { header: 'Fecha', accessor: 'dateRecorded' },
  ]

  return (
    <div className="space-y-8 animate-fade-in-up">
      <section className="surface-panel flex flex-col items-start justify-between gap-4 p-5 md:flex-row md:items-center">
        <div>
          <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-stone-900">Ubicacion de trabajo</h3>
          <p className="text-xs text-stone-500">Selecciona el edificio donde estas registrando medidores.</p>
        </div>
        <select
          value={activeCondominiumId || ''}
          onChange={(event) => setActiveCondominium(event.target.value)}
          className="input-base w-full md:w-72"
        >
          <option value="">Seleccione edificio...</option>
          {condominiums.map((condominium) => (
            <option key={condominium.id} value={condominium.id}>
              {condominium.name}
            </option>
          ))}
        </select>
      </section>

      <section className={`surface-panel p-6 transition-opacity ${!activeCondominiumId ? 'pointer-events-none opacity-60' : 'opacity-100'}`}>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-stone-800">Nueva lectura</h3>
          <p className="text-sm text-stone-500">El consumo se calcula automaticamente usando la lectura anterior.</p>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</div>}
        {success && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{success}</div>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-[180px_220px_1fr_auto]">
          <div>
            <label className="mb-1 block text-sm font-semibold text-stone-700">Unidad</label>
            <select
              value={selectedUnitId}
              onChange={(event) => setSelectedUnitId(event.target.value)}
              disabled={loadingUnits}
              className="input-base"
            >
              <option value="">Seleccionar...</option>
              {availableUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.number ? `Depto ${unit.number}` : `Unidad #${unit.id}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-stone-700">Servicio</label>
            <select value={type} onChange={(event) => setType(event.target.value)} className="input-base">
              {readingTypes.map((readingType) => (
                <option key={readingType.value} value={readingType.value}>
                  {readingType.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-stone-700">Lectura actual</label>
            <input
              type="number"
              placeholder="Ej: 462"
              value={currentReading}
              onChange={(event) => setCurrentReading(event.target.value)}
              className="input-base font-mono"
            />
          </div>

          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full bg-emerald-600 hover:bg-emerald-700 md:w-auto">
              Guardar
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-bold text-stone-900">Registros del mes</h3>
          <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-bold text-stone-600">{displayReadings.length} ingresos</span>
        </div>

        <DataTable
          columns={readingColumns}
          data={displayReadings}
          emptyMessage="No hay lecturas registradas para este edificio."
          rowKey="id"
          title="Registros de medidores"
        />
      </section>
    </div>
  )
}

export default IngresoMedidores