import { useCallback, useEffect, useMemo, useState } from 'react'
import DashboardLayout from '@shared/ui/DashboardLayout'
import { PaymentFormSection, PaymentHistorySection } from '@widgets/resident-dashboard'
import { residentNavItems } from '@features/resident-dashboard/data/dashboardData'
import useAuth from '@features/auth/hooks/useAuth'
import {
  createPaymentReceiptRequest,
  createPaymentRequest,
  listCommonExpensesRequest,
  listPaymentReceiptsRequest,
  listPaymentsRequest,
} from '@features/condominium-management/api/billing.api'
import { formatCurrencyCLP } from '@shared/lib/format'

const statusClassMap = {
  approved: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  pending: 'bg-amber-100 text-amber-800 border border-amber-200',
  rejected: 'bg-rose-100 text-rose-800 border border-rose-200',
}

const methodLabelMap = {
  transfer: 'Transferencia',
  card: 'Tarjeta',
  cash: 'Efectivo',
}

const getTodayISO = () => new Date().toISOString().split('T')[0]

const ResidentPaymentsPage = () => {
  const { user, accessToken } = useAuth()
  const realName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Residente'

  const [commonExpenses, setCommonExpenses] = useState([])
  const [payments, setPayments] = useState([])
  const [receipts, setReceipts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formData, setFormData] = useState({
    expenseId: '',
    amount: '',
    paymentMethod: 'transfer',
    paymentDate: getTodayISO(),
    receiptFile: null,
  })

  const expenseById = useMemo(() => {
    return commonExpenses.reduce((acc, expense) => {
      acc[expense.id] = expense
      return acc
    }, {})
  }, [commonExpenses])

  const receiptsByPaymentId = useMemo(() => {
    return receipts.reduce((acc, receipt) => {
      const current = acc[receipt.payment]
      if (!current || receipt.id > current.id) {
        acc[receipt.payment] = receipt
      }
      return acc
    }, {})
  }, [receipts])

  const loadData = useCallback(async () => {
    if (!accessToken) {
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const [expenseRows, paymentRows, receiptRows] = await Promise.all([
        listCommonExpensesRequest(accessToken),
        listPaymentsRequest(accessToken),
        listPaymentReceiptsRequest(accessToken),
      ])

      setCommonExpenses(Array.isArray(expenseRows) ? expenseRows : [])
      setPayments(Array.isArray(paymentRows) ? paymentRows : [])
      setReceipts(Array.isArray(receiptRows) ? receiptRows : [])
    } catch (requestError) {
      setError(requestError.message || 'No fue posible cargar pagos y gastos comunes.')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    loadData()
  }, [loadData])

  const expenseOptions = useMemo(() => {
    return commonExpenses
      .filter((expense) => ['pending', 'partial', 'overdue'].includes(expense.status))
      .map((expense) => ({
        id: expense.id,
        label: `Unidad #${expense.unit} - Periodo #${expense.period} - ${formatCurrencyCLP(expense.total_amount)}`,
      }))
  }, [commonExpenses])

  const paymentHistoryColumns = useMemo(
    () => [
      { header: 'ID', accessor: 'id' },
      { header: 'Período', accessor: 'periodLabel' },
      { header: 'Unidad', accessor: 'unitLabel' },
      { header: 'Fecha', accessor: 'paymentDate' },
      { header: 'Monto', accessor: 'amountLabel' },
      {
        header: 'Metodo',
        accessor: 'methodLabel',
      },
      {
        header: 'Estado',
        accessor: (row) => (
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
              statusClassMap[row.status] ?? 'bg-stone-100 text-stone-700 border border-stone-200'
            }`}
          >
            {row.statusLabel}
          </span>
        ),
      },
      {
        header: 'Comprobante',
        accessor: (row) =>
          row.receiptFileName ? (
            <span className="text-xs font-medium text-stone-700">{row.receiptFileName}</span>
          ) : (
            <span className="text-xs text-stone-400">Sin archivo</span>
          ),
      },
    ],
    [],
  )

  const paymentRows = useMemo(() => {
    return payments.map((payment) => {
      const expense = commonExpenses.find(
        (item) => item.period === payment.period && item.unit === payment.unit,
      )
      const latestReceipt = receiptsByPaymentId[payment.id]

      return {
        id: `#${payment.id}`,
        periodLabel: expense ? `Periodo #${expense.period}` : `Periodo #${payment.period || '-'}`,
        unitLabel: payment.unit ? `Unidad #${payment.unit}` : '-',
        paymentDate: payment.payment_date,
        amountLabel: formatCurrencyCLP(payment.amount),
        methodLabel: methodLabelMap[payment.payment_method] || payment.payment_method,
        status: payment.status,
        statusLabel:
          payment.status === 'approved'
            ? 'Aprobado'
            : payment.status === 'rejected'
              ? 'Rechazado'
              : 'Pendiente',
        receiptFileName: latestReceipt?.original_name || '',
      }
    })
  }, [payments, commonExpenses, receiptsByPaymentId])

  const onChange = (field, value) => {
    setFieldErrors((previous) => ({ ...previous, [field]: '' }))
    setFormData((previous) => ({ ...previous, [field]: value }))
    setFeedback('')

    if (field === 'expenseId') {
      const selectedExpense = expenseById[Number(value)]
      if (selectedExpense) {
        setFormData((previous) => ({
          ...previous,
          expenseId: value,
          amount: String(selectedExpense.total_amount || ''),
        }))
      }
    }
  }

  const onFileSelect = (file) => {
    setFieldErrors((previous) => ({ ...previous, receipt: '' }))
    setFormData((previous) => ({ ...previous, receiptFile: file }))
  }

  const validateForm = () => {
    const nextErrors = {}

    if (!formData.expenseId) {
      nextErrors.expenseId = 'Debes seleccionar un gasto comun.'
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      nextErrors.amount = 'El monto debe ser mayor a cero.'
    }
    if (!formData.paymentDate) {
      nextErrors.paymentDate = 'Debes indicar la fecha de pago.'
    }
    if (!formData.receiptFile) {
      nextErrors.receipt = 'Debes adjuntar un comprobante.'
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const onSubmit = async (event) => {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    const selectedExpense = expenseById[Number(formData.expenseId)]
    if (!selectedExpense) {
      setError('El gasto comun seleccionado no existe.')
      return
    }

    setIsSubmitting(true)
    setError('')
    setFeedback('')

    try {
      const createdPayment = await createPaymentRequest(
        {
          unit: selectedExpense.unit,
          period: selectedExpense.period,
          amount: Number(formData.amount),
          payment_date: formData.paymentDate,
          payment_method: formData.paymentMethod,
        },
        accessToken,
      )

      await createPaymentReceiptRequest(
        {
          payment: createdPayment.id,
          file: formData.receiptFile,
          original_name: formData.receiptFile.name,
        },
        accessToken,
      )

      setFeedback('Comprobante enviado. Tu pago quedó en validación.')
      setFormData({
        expenseId: '',
        amount: '',
        paymentMethod: 'transfer',
        paymentDate: getTodayISO(),
        receiptFile: null,
      })
      await loadData()
    } catch (submitError) {
      setError(submitError.message || 'No fue posible informar el pago.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout userRole="Residente" userName={realName} title="Pagos" navItems={residentNavItems}>
      <div className="max-w-7xl mx-auto pb-12">
        <header className="mb-8 mt-2">
          <h1 className="text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight">Gestión de pagos</h1>
          <p className="text-stone-600 mt-2 text-base">
            Administra tus transferencias y revisa el estado de tus comprobantes.
          </p>
        </header>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <PaymentFormSection
              formData={formData}
              expenseOptions={expenseOptions}
              fieldErrors={fieldErrors}
              feedback={feedback}
              isSubmitting={isSubmitting}
              disabled={isLoading}
              onSubmit={onSubmit}
              onChange={onChange}
              onFileSelect={onFileSelect}
            />
          </div>
          <PaymentHistorySection
            sectionId="historial"
            columns={paymentHistoryColumns}
            data={paymentRows}
            isLoading={isLoading}
            onRefresh={loadData}
            emptyMessage="Aun no tienes pagos registrados."
          />
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ResidentPaymentsPage
