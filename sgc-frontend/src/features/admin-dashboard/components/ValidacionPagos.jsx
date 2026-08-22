import { useCallback, useEffect, useMemo, useState } from 'react'
import useAuth from '@features/auth/hooks/useAuth'
import useCondominium from '@features/condominium-management/hooks/useCondominium'
import { API_CONFIG } from '@shared/config/api'
import {
  listPaymentReceiptsRequest,
  listPaymentsRequest,
  listUnitsRequest,
  patchPaymentRequest,
} from '@features/condominium-management/api/billing.api'
import { formatCurrencyCLP } from '@shared/lib/format'

const toStatusPayload = (status) => ({
  status,
  validation_date: new Date().toISOString().split('T')[0],
})

const toAbsoluteReceiptUrl = (fileUrl) => {
  if (!fileUrl) return ''
  if (fileUrl.startsWith('http')) return fileUrl
  const apiOrigin = API_CONFIG.baseUrl.replace(/\/api\/?$/, '')
  return `${apiOrigin}${fileUrl}`
}

const paymentMethodLabel = {
  transfer: 'Transferencia',
  card: 'Tarjeta',
  cash: 'Efectivo',
}

const paymentStatusMeta = {
  pending: { label: 'Pendiente', badgeClass: 'bg-amber-100 text-amber-800 border border-amber-200' },
  approved: { label: 'Aprobado', badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
  rejected: { label: 'Rechazado', badgeClass: 'bg-rose-100 text-rose-800 border border-rose-200' },
}

const ValidacionPagos = () => {
  const { accessToken } = useAuth()
  const { condominiums, activeCondominiumId, setActiveCondominium } = useCondominium()

  const [payments, setPayments] = useState([])
  const [units, setUnits] = useState([])
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activePaymentId, setActivePaymentId] = useState(null)

  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [activeUnitId, setActiveUnitId] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const loadData = useCallback(async () => {
    if (!accessToken) return

    setLoading(true)
    setError('')

    try {
      const [paymentRows, unitRows, receiptRows] = await Promise.all([
        listPaymentsRequest(accessToken),
        listUnitsRequest(accessToken),
        listPaymentReceiptsRequest(accessToken),
      ])

      setPayments(Array.isArray(paymentRows) ? paymentRows : [])
      setUnits(Array.isArray(unitRows) ? unitRows : [])
      setReceipts(Array.isArray(receiptRows) ? receiptRows : [])
    } catch (requestError) {
      setError(requestError.message || 'Error al cargar la gestión de pagos.')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setActiveUnitId('all')
  }, [activeCondominiumId])

  const unitById = useMemo(() => {
    return units.reduce((accumulator, unit) => {
      accumulator[unit.id] = unit
      return accumulator
    }, {})
  }, [units])

  const availableUnits = useMemo(() => {
    if (!activeCondominiumId) return []
    return units.filter((unit) => String(unit.condominium) === String(activeCondominiumId))
  }, [units, activeCondominiumId])

  const paymentRows = useMemo(() => {
    return payments.map((payment) => {
      const unit = unitById[payment.unit]
      const meta = paymentStatusMeta[payment.status] || { label: payment.status, badgeClass: 'bg-stone-100 text-stone-700' }
      const receipt = receipts.find((item) => item.payment === payment.id)

      return {
        ...payment,
        statusLabel: meta.label,
        statusClass: meta.badgeClass,
        amountLabel: formatCurrencyCLP(payment.amount),
        unitLabel: unit?.number ? `Depto ${unit.number}` : `Unidad #${payment.unit}`,
        condominiumId: unit?.condominium || null,
        methodLabel: paymentMethodLabel[payment.payment_method] || payment.payment_method,
        receiptFile: receipt?.file || '',
      }
    })
  }, [payments, unitById, receipts])

  const filteredRows = useMemo(() => {
    return paymentRows.filter((row) => {
      if (activeCondominiumId && String(row.condominiumId) !== String(activeCondominiumId)) return false
      if (activeUnitId !== 'all' && String(row.unit) !== String(activeUnitId)) return false
      if (statusFilter !== 'all' && row.status !== statusFilter) return false
      if (methodFilter !== 'all' && row.payment_method !== methodFilter) return false

      const term = searchTerm.trim().toLowerCase()
      if (!term) return true
      return row.unitLabel.toLowerCase().includes(term) || String(row.id).includes(term)
    })
  }, [paymentRows, activeCondominiumId, activeUnitId, statusFilter, methodFilter, searchTerm])

  const onUpdateStatus = async (paymentId, nextStatus) => {
    setActivePaymentId(paymentId)
    setError('')

    try {
      await patchPaymentRequest(paymentId, toStatusPayload(nextStatus), accessToken)
      await loadData()
    } catch (requestError) {
      setError(requestError.message || 'No se pudo actualizar el estado del pago.')
    } finally {
      setActivePaymentId(null)
    }
  }

  return (
    <div className="space-y-6">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

      <section className="surface-panel p-5">
        <h3 className="mb-4 font-bold text-stone-900">Contexto de condominio</h3>
        <select
          value={activeCondominiumId || ''}
          onChange={(event) => setActiveCondominium(event.target.value)}
          className="input-base"
        >
          {!condominiums.length && <option value="">Sin condominios disponibles</option>}
          <option value="">Seleccione un edificio...</option>
          {condominiums.map((condominium) => (
            <option key={condominium.id} value={condominium.id}>
              {condominium.name}
            </option>
          ))}
        </select>
      </section>

      <section className="surface-panel grid gap-4 p-5 md:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase text-stone-500">Estado</label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input-base py-2">
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="approved">Aprobados</option>
            <option value="rejected">Rechazados</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase text-stone-500">Metodo</label>
          <select value={methodFilter} onChange={(event) => setMethodFilter(event.target.value)} className="input-base py-2">
            <option value="all">Todos</option>
            <option value="transfer">Transferencia</option>
            <option value="card">Tarjeta</option>
            <option value="cash">Efectivo</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase text-stone-500">Unidad</label>
          <select
            value={activeUnitId}
            onChange={(event) => setActiveUnitId(event.target.value)}
            disabled={!activeCondominiumId}
            className="input-base py-2 disabled:bg-stone-100"
          >
            <option value="all">Todas las unidades</option>
            {availableUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>
                Depto {unit.number}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase text-stone-500">Buscador rapido</label>
          <input
            type="text"
            placeholder="ID o Depto..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="input-base py-2"
          />
        </div>
      </section>

      <section className="surface-panel overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-stone-500">Cargando registros...</div>
        ) : filteredRows.length === 0 ? (
          <div className="p-10 text-center text-stone-500">No se encontraron pagos con estos filtros.</div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {filteredRows.map((payment) => (
              <li key={payment.id} className="flex flex-col gap-4 p-5 transition-colors hover:bg-stone-50 md:flex-row md:items-center md:justify-between">
                <div className="flex w-full items-center gap-4">
                  <div className="rounded-lg bg-stone-100 px-4 py-2 text-center">
                    <span className="block text-[10px] font-bold text-stone-400">ID</span>
                    <span className="font-bold text-stone-700">#{payment.id}</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="m-0 truncate font-bold text-stone-900">{payment.amountLabel}</h4>
                    <p className="m-0 truncate text-sm text-stone-600">
                      {payment.unitLabel} - {payment.methodLabel}
                    </p>
                  </div>
                </div>

                <div className="flex w-full flex-wrap items-center justify-end gap-2 md:w-auto">
                  {payment.receiptFile ? (
                    <a
                      href={toAbsoluteReceiptUrl(payment.receiptFile)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary px-3 py-2 text-xs"
                    >
                      Ver comprobante
                    </a>
                  ) : (
                    <span className="rounded-lg bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-500">Sin comprobante</span>
                  )}

                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${payment.statusClass}`}>{payment.statusLabel}</span>

                  {payment.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(payment.id, 'approved')}
                        disabled={activePaymentId === payment.id}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                      >
                        Aprobar
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(payment.id, 'rejected')}
                        disabled={activePaymentId === payment.id}
                        className="rounded-lg border border-red-200 px-4 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default ValidacionPagos
