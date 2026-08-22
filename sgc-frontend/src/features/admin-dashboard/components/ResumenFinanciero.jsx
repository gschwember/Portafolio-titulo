import { useState, useMemo } from 'react'
import { financialStats, commonExpensesMock, expenseStatusOptions } from '../data/adminDashboardData'

const ResumenFinanciero = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  
  // Dos estados independientes para los modales
  const [expenseToDetail, setExpenseToDetail] = useState(null)
  const [expenseToHistory, setExpenseToHistory] = useState(null)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pagado': return 'bg-emerald-100 text-emerald-700'
      case 'pendiente': return 'bg-amber-100 text-amber-700'
      case 'moroso': return 'bg-red-100 text-red-700'
      default: return 'bg-stone-200 text-stone-600'
    }
  }

  const filteredExpenses = useMemo(() => {
    return commonExpensesMock.filter(expense => {
      const matchSearch = 
        expense.unit.includes(searchTerm) ||
        expense.owner.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchStatus = statusFilter === 'Todos' || expense.status === statusFilter

      return matchSearch && matchStatus
    })
  }, [searchTerm, statusFilter])

  return (
    <div className="space-y-6">
      {/* Tarjetas de Métricas (HU-10) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200 flex flex-col">
          <span className="text-sm font-semibold text-stone-500 mb-1">Total Recaudado (Mes)</span>
          <span className="text-2xl font-bold text-emerald-600">{formatCurrency(financialStats.totalCollected)}</span>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200 flex flex-col">
          <span className="text-sm font-semibold text-stone-500 mb-1">Total Pendiente</span>
          <span className="text-2xl font-bold text-amber-600">{formatCurrency(financialStats.totalPending)}</span>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200 flex flex-col">
          <span className="text-sm font-semibold text-stone-500 mb-1">Índice de Morosidad</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-600">{financialStats.delinquencyRate}%</span>
            <span className="text-xs text-stone-500">de {financialStats.activeUnits} unidades</span>
          </div>
        </div>
      </div>

      {/* Tabla Principal */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden relative">
        <div className="px-6 py-5 border-b border-stone-200 flex justify-between items-center bg-stone-50">
          <div>
            <h3 className="text-lg font-bold text-stone-800">Control de Gastos Comunes</h3>
            <p className="text-sm text-stone-500">Gestiona los pagos y deudas de las unidades.</p>
          </div>
        </div>

        {/* Buscador y Filtro */}
        <div className="px-6 py-4 border-b border-stone-200 bg-white flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por departamento o propietario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-sm"
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-sm bg-white text-stone-700"
            >
              {expenseStatusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-100/50 text-stone-500 text-xs uppercase tracking-wider border-b border-stone-200">
                <th className="px-6 py-4 font-semibold">Depto</th>
                <th className="px-6 py-4 font-semibold">Propietario</th>
                <th className="px-6 py-4 font-semibold">Monto</th>
                <th className="px-6 py-4 font-semibold">Período</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-stone-500 font-medium">No se encontraron registros.</p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-stone-800">{expense.unit}</td>
                    <td className="px-6 py-4 text-sm text-stone-900">{expense.owner}</td>
                    <td className="px-6 py-4 text-sm font-medium text-stone-700">{formatCurrency(expense.amount)}</td>
                    <td className="px-6 py-4 text-sm text-stone-600">{expense.period}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${getStatusBadge(expense.status)}`}>
                        {expense.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-4">
                      {/* DOS BOTONES INDEPENDIENTES */}
                      <button onClick={() => setExpenseToHistory(expense)} className="font-semibold text-stone-500 hover:text-stone-800">
                        Historial
                      </button>
                      <button onClick={() => setExpenseToDetail(expense)} className="font-semibold text-amber-600 hover:text-amber-800">
                        Ver boleta
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================
          MODAL 1: BOLETA DEL MES (DESGLOSE)
          ========================================= */}
      {expenseToDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            
            <div className="px-6 py-5 border-b border-stone-200 bg-stone-50 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-stone-800">Depto {expenseToDetail.unit} - Boleta</h3>
                <p className="text-sm text-stone-500 mt-1"><span className="font-medium text-stone-700">{expenseToDetail.owner}</span></p>
              </div>
              <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${getStatusBadge(expenseToDetail.status)}`}>
                {expenseToDetail.status}
              </span>
            </div>

            <div className="p-6">
              <div className="mb-6 flex justify-between items-center text-sm">
                <span className="text-stone-500 font-medium">Período de cobro:</span>
                <span className="font-bold text-stone-800">{expenseToDetail.period}</span>
              </div>

              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Desglose Actual</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-600">Gasto Común Base</span>
                  <span className="font-medium text-stone-800">{formatCurrency(expenseToDetail.amount * 0.75)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Fondo de Reserva (5%)</span>
                  <span className="font-medium text-stone-800">{formatCurrency(expenseToDetail.amount * 0.05)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Agua Caliente</span>
                  <span className="font-medium text-stone-800">{formatCurrency(expenseToDetail.amount * 0.20)}</span>
                </div>
                {expenseToDetail.status === 'moroso' && (
                  <div className="flex justify-between text-red-600">
                    <span>Multa por atraso</span>
                    <span className="font-medium">{formatCurrency(15000)}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-stone-200 flex justify-between items-center">
                <span className="text-base font-bold text-stone-800">Total a Pagar</span>
                <span className="text-2xl font-bold text-stone-900">
                  {formatCurrency(expenseToDetail.status === 'moroso' ? expenseToDetail.amount + 15000 : expenseToDetail.amount)}
                </span>
              </div>
            </div>

            <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button onClick={() => setExpenseToDetail(null)} className="px-4 py-2 text-sm font-bold text-stone-600 hover:bg-stone-200 rounded-lg transition-colors">
                Cerrar Boleta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 2: HISTORIAL DE PAGOS (HU-13)
          ========================================= */}
      {expenseToHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            
            <div className="px-6 py-5 border-b border-stone-200 bg-stone-900 text-white flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold">Estado de Cuenta</h3>
                <p className="text-sm text-stone-300 mt-1">Depto {expenseToHistory.unit} - {expenseToHistory.owner}</p>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-stone-100 rounded-lg p-4 mb-6 flex justify-between items-center">
                <div>
                  <span className="block text-xs font-bold text-stone-500 uppercase tracking-wider">Deuda Acumulada</span>
                  {expenseToHistory.status === 'moroso' ? (
                    <span className="text-2xl font-bold text-red-600">{formatCurrency(expenseToHistory.amount * 2)}</span>
                  ) : (
                    <span className="text-2xl font-bold text-emerald-600">$0</span>
                  )}
                </div>
                <button className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold rounded-lg transition-colors shadow-sm">
                  Descargar PDF
                </button>
              </div>

              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Movimientos Históricos</h4>
              
              <div className="space-y-3">
                {/* Mes Actual (Simulado) */}
                <div className="flex justify-between items-center p-3 border-l-4 border-amber-500 bg-white shadow-sm border-y border-r border-stone-200 rounded-r-lg">
                  <div>
                    <span className="font-bold text-stone-800 block">Marzo 2026</span>
                    <span className="text-xs font-medium text-amber-600">Cobro Emitido</span>
                  </div>
                  <span className="font-bold text-stone-800">-{formatCurrency(expenseToHistory.amount)}</span>
                </div>

                {/* Meses Anteriores (Simulados) */}
                <div className="flex justify-between items-center p-3 border-l-4 border-emerald-500 bg-white shadow-sm border-y border-r border-stone-200 rounded-r-lg">
                  <div>
                    <span className="font-bold text-stone-800 block">Febrero 2026</span>
                    <span className="text-xs font-medium text-emerald-600">Pagado con Transferencia</span>
                  </div>
                  <span className="font-bold text-stone-800">+{formatCurrency(expenseToHistory.amount)}</span>
                </div>

                <div className="flex justify-between items-center p-3 border-l-4 border-emerald-500 bg-white shadow-sm border-y border-r border-stone-200 rounded-r-lg">
                  <div>
                    <span className="font-bold text-stone-800 block">Enero 2026</span>
                    <span className="text-xs font-medium text-emerald-600">Pagado con Transferencia</span>
                  </div>
                  <span className="font-bold text-stone-800">+{formatCurrency(expenseToHistory.amount * 0.95)}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button onClick={() => setExpenseToHistory(null)} className="px-4 py-2 text-sm font-bold text-stone-600 hover:bg-stone-200 rounded-lg transition-colors">
                Cerrar Historial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResumenFinanciero