import { useState, useMemo, useEffect, useCallback } from 'react'
import useAuth from '@features/auth/hooks/useAuth'
import useCondominium from '@features/condominium-management/hooks/useCondominium'
import { formatCurrencyCLP } from '@shared/lib/format'
import { listPaymentsRequest, listUnitsRequest, listBillingPeriodsRequest, closeBillingPeriodRequest, createBillingPeriodRequest } from '@features/condominium-management/api/billing.api'

const CierreMes = () => {
  const { accessToken } = useAuth()
  const { condominiums, activeCondominiumId, activeCondominium, setActiveCondominium } = useCondominium()

  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [payments, setPayments] = useState([])
  const [units, setUnits] = useState([])
  const [periods, setPeriods] = useState([])

  const loadImpactData = useCallback(async () => {
    if (!accessToken || !activeCondominiumId) return

    try {
      const [paymentData, unitData, periodData] = await Promise.all([
        listPaymentsRequest(accessToken),
        listUnitsRequest(accessToken),
        listBillingPeriodsRequest(accessToken),
      ])
      setError('')
      setPayments(Array.isArray(paymentData) ? paymentData : [])
      setUnits(Array.isArray(unitData) ? unitData : [])
      setPeriods(Array.isArray(periodData) ? periodData : [])
    } catch (requestError) {
      setError(requestError.message || 'No se pudo cargar el resumen de impacto.')
    }
  }, [accessToken, activeCondominiumId])

  useEffect(() => {
    const requestTimer = window.setTimeout(loadImpactData, 0)
    return () => window.clearTimeout(requestTimer)
  }, [loadImpactData])

  const impactStats = useMemo(() => {
    const condominiumUnits = units.filter((unit) => String(unit.condominium) === String(activeCondominiumId))
    const condominiumPayments = payments.filter((payment) => {
      const unit = units.find((item) => item.id === payment.unit)
      return unit && String(unit.condominium) === String(activeCondominiumId)
    })

    const pendingPayments = condominiumPayments.filter((payment) => payment.status === 'pending' || payment.status === 'rejected')
    const totalPendingAmount = pendingPayments.reduce((accumulator, payment) => accumulator + Number(payment.amount || 0), 0)
    const unitsWithDebt = new Set(pendingPayments.map((payment) => payment.unit))
    const delinquencyRate = condominiumUnits.length > 0 ? ((unitsWithDebt.size / condominiumUnits.length) * 100).toFixed(1) : '0.0'

    const currentPeriod = periods.find((period) => period.status !== 'closed')
    const periodLabel = currentPeriod
      ? `${currentPeriod.start_date || ''} - ${currentPeriod.end_date || ''}`.trim()
      : 'Período actual'

    return {
      activeUnits: condominiumUnits.length,
      delinquencyRate,
      totalPending: totalPendingAmount,
      periodLabel,
    }
  }, [units, payments, periods, activeCondominiumId])

  const handleExecute = async () => {
    if (!activeCondominiumId) return
    
    const currentPeriod = periods.find((period) => period.status === 'open')
    
    if (!currentPeriod) {
      setError('No hay un período abierto para cerrar en este momento.')
      return
    }

    setStep(2) 
    setError('')
    setSuccess('')

    try {
      await closeBillingPeriodRequest(currentPeriod.id, accessToken)

      await loadImpactData()
      setStep(3)
    } catch (err) {
      setError(err.message || 'Error crítico al procesar el cierre masivo.')
      setStep(1)
    }
  }

  

  const handleStartInitialPeriod = async () => {
    if (!activeCondominiumId) return
    setError('')
    setSuccess('')

    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    
    const firstDay = new Date(year, month, 1).toISOString().split('T')[0]
    const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0]

    try {
      await createBillingPeriodRequest({
        condominium: activeCondominiumId,
        start_date: firstDay,
        end_date: lastDay,
        status: 'open'
      }, accessToken)
      
      setSuccess('¡Primer período iniciado con éxito!')
      await loadImpactData() 
    } catch (err) {
      setError(err.message || 'Error al iniciar el período.')
    }
  }

  const currentPeriod = periods.find((p) => p.status === 'open' && p.condominium === Number(activeCondominiumId))

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in-up">
      <section className="surface-panel p-5">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-stone-900">Contexto de gestión</h3>
        <select
          value={activeCondominiumId || ''}
          onChange={(event) => {
            setActiveCondominium(event.target.value)
            setStep(1)
          }}
          className="input-base"
        >
          {!condominiums.length && <option value="">Sin condominios disponibles</option>}
          <option value="">Seleccione un condominio para cerrar mes...</option>
          {condominiums.map((condominium) => (
            <option key={condominium.id} value={condominium.id}>
              {condominium.name}
            </option>
          ))}
        </select>
      </section>

      <section className="surface-panel overflow-hidden">
        <div className="flex items-center gap-3 border-b border-stone-200 bg-stone-900 px-6 py-5 text-white">
          <div className="rounded-lg bg-amber-500/20 p-2">
            <svg className="h-6 w-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M12 9.5v2.75m0 3h.01m8.24-3a8.25 8.25 0 11-16.5 0 8.25 8.25 0 0116.5 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
              />
            </svg>
          </div>
          <div>
            <h3 className="m-0 text-lg font-bold">
              {activeCondominium ? `Cierre mensual: ${activeCondominium.name}` : 'Ejecución de cierre'}
            </h3>
            <p className="m-0 mt-1 text-sm text-stone-400">{impactStats.periodLabel}</p>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {!activeCondominiumId ? (
            <p className="py-10 text-center italic text-stone-500">
              Debes seleccionar un condominio para revisar impacto y ejecutar el cierre.
            </p>
          ) : (
            <>
              {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}            
              {success && <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div>}

              {step === 1 && (
                <div className="space-y-6">
                  <p className="text-sm leading-relaxed text-stone-600">
                    Esta accion emitira cobros mensuales para <strong>{impactStats.activeUnits} unidades</strong> y
                    consolidara pagos pendientes.
                  </p>

                  <div className="grid grid-cols-1 gap-6 rounded-xl border border-stone-200 bg-stone-50 p-6 md:grid-cols-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase text-stone-400">Unidades activas</span>
                      <span className="text-xl font-bold text-stone-800">{impactStats.activeUnits}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase text-stone-400">Morosidad</span>
                      <span className="text-xl font-bold text-red-600">{impactStats.delinquencyRate}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase text-stone-400">Por recaudar</span>
                      <span className="text-xl font-bold text-amber-600">{formatCurrencyCLP(impactStats.totalPending)}</span>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end gap-3 border-t border-stone-200 pt-5">
                    <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                      Cancelar
                    </button>
                    
                    {currentPeriod ? (
                      <button type="button" onClick={handleExecute} className="btn-primary bg-rose-600 hover:bg-rose-700">
                        Ejecutar cierre y emitir cobros
                      </button>
                    ) : (
                      <button type="button" onClick={handleStartInitialPeriod} className="btn-primary bg-emerald-600 hover:bg-emerald-700">
                        Iniciar Primer Periodo (Mes Actual)
                      </button>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 py-14 text-center">
                  <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-stone-100 border-t-amber-500" />
                  <h3 className="text-xl font-bold text-stone-800">Procesando cierre masivo...</h3>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 py-10 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M4.5 12.75l6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-stone-800">Cierre finalizado</h3>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-lg bg-stone-900 px-8 py-2.5 font-bold text-white transition-colors hover:bg-stone-800"
                  >
                    Volver
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default CierreMes
