import { useState, useEffect, useMemo, useCallback } from 'react'
import useAuth from '@features/auth/hooks/useAuth'
import useCondominium from '@features/condominium-management/hooks/useCondominium'
import { listUnitsRequest } from '@features/condominium-management/api/billing.api'
import { commonExpensesMock } from '../data/adminDashboardData'
import { formatCurrencyCLP } from '@shared/lib/format'
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const EstadoCuenta = () => {
  const { accessToken } = useAuth()
  const { condominiums, activeCondominiumId, activeCondominium, setActiveCondominium } = useCondominium()

  const [units, setUnits] = useState([])
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [selectedUnitData, setSelectedUnitData] = useState(null)
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [error, setError] = useState('')

  const loadUnits = useCallback(async () => {
    if (!accessToken) return

    setLoadingUnits(true)
    setError('')

    try {
      const data = await listUnitsRequest(accessToken)
      setUnits(Array.isArray(data) ? data : [])
    } catch (requestError) {
      setUnits([])
      setError(requestError.message || 'No se pudieron cargar las unidades.')
    } finally {
      setLoadingUnits(false)
    }
  }, [accessToken])

  useEffect(() => {
    loadUnits()
  }, [loadUnits])

  const availableUnits = useMemo(() => {
    if (!activeCondominiumId) return []
    return units.filter((unit) => String(unit.condominium) === String(activeCondominiumId))
  }, [units, activeCondominiumId])

  useEffect(() => {
    setSelectedUnitId('')
    setSelectedUnitData(null)
  }, [activeCondominiumId])

  const handleSearch = (event) => {
    event.preventDefault()
    setError('')

    if (!selectedUnitId) return
    const selectedUnit = units.find((unit) => String(unit.id) === String(selectedUnitId))
    const unitNumber = String(selectedUnit?.number || selectedUnitId)
    const foundData = commonExpensesMock.find((expense) => String(expense.unit) === unitNumber)

    if (foundData) {
      setSelectedUnitData(foundData)
      return
    }

    setSelectedUnitData(null)
    setError('No se encontraron registros financieros para esta unidad.')
  }

  const downloadPDF = () => {
    if (!selectedUnitData) return

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const condominiumName = activeCondominium?.name || 'Condominio'

    doc.setFontSize(20)
    doc.setTextColor(40, 40, 40)
    doc.text('ESTADO DE CUENTA', 15, 20)

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 15, 26)

    doc.setDrawColor(200, 200, 200)
    doc.line(15, 32, pageWidth - 15, 32)

    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.text('INFORMACION GENERAL', 15, 42)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Condominio: ${condominiumName}`, 15, 50)
    doc.text(`Unidad: Depto ${selectedUnitData.unit}`, 15, 56)
    doc.text(`Copropietario: ${selectedUnitData.owner}`, 15, 62)

    doc.setFillColor(245, 245, 245)
    doc.rect(130, 42, 65, 20, 'F')
    doc.setFont('helvetica', 'bold')
    doc.text('SALDO PENDIENTE', 135, 48)
    doc.setFontSize(14)
    doc.setTextColor(180, 0, 0)
    doc.text(formatCurrencyCLP(selectedUnitData.amount), 135, 57)

    const tableData = [
      ['Marzo 2026', 'Gasto común - Período actual', formatCurrencyCLP(selectedUnitData.amount), 'Pendiente'],
      ['Febrero 2026', 'Pago recibido - Transferencia', `+${formatCurrencyCLP(selectedUnitData.amount)}`, 'Aprobado'],
      ['Enero 2026', 'Pago recibido - Transferencia', `+${formatCurrencyCLP(selectedUnitData.amount)}`, 'Aprobado'],
    ]

    autoTable(doc,{
      startY: 75,
      head: [['Fecha', 'Descripcion', 'Monto', 'Estado']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [40, 40, 40], fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 4 },
    })

    const finalY = doc.lastAutoTable.finalY || 150
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      'Este documento es un comprobante informativo generado por el Sistema de Gestión de Condominios (SGC).',
      pageWidth / 2,
      finalY + 20,
      { align: 'center' },
    )

    doc.save(`Estado_Cuenta_Depto_${selectedUnitData.unit}.pdf`)
  }

  return (
    <div className="space-y-6">
      <section className="surface-panel p-6">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-stone-900">Consulta de estado historico</h3>
          <p className="text-sm text-stone-500">Selecciona condominio y unidad para generar el informe.</p>
        </div>

        <form onSubmit={handleSearch} className="grid items-end gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Condominio</label>
            <select
              value={activeCondominiumId || ''}
              onChange={(event) => setActiveCondominium(event.target.value)}
              className="input-base"
            >
              {!condominiums.length ? (
                <option value="">Sin condominios disponibles</option>
              ) : (
                <>
                  <option value="">Seleccione condominio...</option>
                  {condominiums.map((condominium) => (
                    <option key={condominium.id} value={condominium.id}>
                      {condominium.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Unidad</label>
            <select
              value={selectedUnitId}
              onChange={(event) => setSelectedUnitId(event.target.value)}
              disabled={!activeCondominiumId || loadingUnits}
              className="input-base disabled:bg-stone-100"
            >
              <option value="">{!activeCondominiumId ? 'Elige condominio' : 'Seleccione unidad...'}</option>
              {availableUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.number ? `Depto ${unit.number}` : `Unidad #${unit.id}`}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={!selectedUnitId} className="btn-primary w-full md:w-auto">
            Ver historial
          </button>
        </form>

        {error && <p className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      </section>

      {selectedUnitData && (
        <section className="surface-panel overflow-hidden animate-fade-in-up">
          <div className="flex flex-col gap-3 bg-stone-900 p-6 text-white md:flex-row md:items-center md:justify-between">
            <div>
              <h4 className="m-0 text-xl font-bold">Resumen de movimientos</h4>
              <p className="m-0 text-sm text-stone-300">
                Depto {selectedUnitData.unit} - {selectedUnitData.owner}
              </p>
            </div>
            <button onClick={downloadPDF} className="btn-primary bg-amber-500 text-stone-900 hover:bg-amber-400">
              Descargar PDF
            </button>
          </div>

          <div className="p-6">
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-stone-100 bg-stone-50 p-5">
                <span className="mb-1 block text-xs font-bold uppercase text-stone-500">Deuda pendiente</span>
                <span className="text-3xl font-black text-red-600">{formatCurrencyCLP(selectedUnitData.amount)}</span>
              </div>
              <div className="rounded-xl border border-stone-100 bg-stone-50 p-5">
                <span className="mb-1 block text-xs font-bold uppercase text-stone-500">Estado de cuenta</span>
                <span
                  className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-bold ${
                    selectedUnitData.status === 'moroso' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {selectedUnitData.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-[10px] font-bold uppercase text-stone-400">
                    <th className="py-3">Período</th>
                    <th className="py-3">Descripcion</th>
                    <th className="py-3">Monto</th>
                    <th className="py-3 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  <tr className="transition-colors hover:bg-stone-50">
                    <td className="py-4 font-bold">Marzo 2026</td>
                    <td className="py-4 text-stone-600">Cobro gasto comun</td>
                    <td className="py-4 font-bold text-red-600">-{formatCurrencyCLP(selectedUnitData.amount)}</td>
                    <td className="py-4 text-right">
                      <span className="rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">Pendiente</span>
                    </td>
                  </tr>
                  <tr className="transition-colors hover:bg-stone-50">
                    <td className="py-4 font-bold">Febrero 2026</td>
                    <td className="py-4 text-stone-600">Pago recibido</td>
                    <td className="py-4 font-bold text-emerald-600">+{formatCurrencyCLP(selectedUnitData.amount)}</td>
                    <td className="py-4 text-right">
                      <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">Aprobado</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default EstadoCuenta
