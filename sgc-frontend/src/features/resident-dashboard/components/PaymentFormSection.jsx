import FileUploader from '@shared/ui/FileUploader'
import FormInput from '@shared/ui/FormInput'

const defaultMethods = [
  { value: 'transfer', label: 'Transferencia' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'cash', label: 'Efectivo' },
]

const PaymentFormSection = ({
  sectionId = 'seccion-pago',
  formData,
  expenseOptions = [],
  methodOptions = defaultMethods,
  fieldErrors = {},
  feedback = '',
  isSubmitting = false,
  disabled = false,
  onSubmit,
  onChange,
  onFileSelect,
}) => {
  const hasOptions = expenseOptions.length > 0
  const isSubmitDisabled =
    disabled ||
    isSubmitting ||
    !formData?.expenseId ||
    !formData?.amount ||
    !formData?.receiptFile

  return (
    <section id={sectionId} className="surface-panel-soft p-6 md:p-8 animate-fade-in-up">
      <h2 className="mb-2 border-b border-stone-200 pb-4 text-xl font-bold uppercase tracking-wide text-stone-900">
        Informar pago
      </h2>
      <p className="mb-6 mt-4 text-sm text-stone-600">
        Selecciona el gasto comun y sube el comprobante para validacion contable.
      </p>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="mb-4 flex w-full flex-col">
          <label className="mb-1.5 text-sm font-semibold text-stone-700">Gasto comun</label>
          <select
            value={formData?.expenseId || ''}
            onChange={(event) => onChange?.('expenseId', event.target.value)}
            className="input-base bg-stone-50"
            disabled={disabled || !hasOptions}
            required
          >
            <option value="">{hasOptions ? 'Selecciona un gasto comun' : 'No hay gastos comunes pendientes'}</option>
            {expenseOptions.map((expense) => (
              <option key={expense.id} value={expense.id}>
                {expense.label}
              </option>
            ))}
          </select>
          {fieldErrors.expenseId && <span className="mt-1 text-xs text-red-600">{fieldErrors.expenseId}</span>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormInput
            label="Monto transferido"
            type="number"
            placeholder="Ej. 85000"
            required
            value={formData?.amount || ''}
            onChange={(event) => onChange?.('amount', event.target.value)}
            error={fieldErrors.amount}
            disabled={disabled}
          />
          <FormInput
            label="Fecha de pago"
            type="date"
            required
            value={formData?.paymentDate || ''}
            onChange={(event) => onChange?.('paymentDate', event.target.value)}
            error={fieldErrors.paymentDate}
            disabled={disabled}
          />
        </div>

        <div className="mb-4 flex w-full flex-col">
          <label className="mb-1.5 text-sm font-semibold text-stone-700">Metodo de pago</label>
          <select
            value={formData?.paymentMethod || 'transfer'}
            onChange={(event) => onChange?.('paymentMethod', event.target.value)}
            className="input-base bg-stone-50"
            disabled={disabled}
          >
            {methodOptions.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </div>

        <FileUploader label="Comprobante adjunto" onFileSelect={onFileSelect} disabled={disabled} />
        {fieldErrors.receipt && <span className="mt-1 text-xs text-red-600">{fieldErrors.receipt}</span>}

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="btn-primary mt-4 w-full"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar a validación'}
        </button>
      </form>

      {feedback && (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          {feedback}
        </p>
      )}
    </section>
  )
}

export default PaymentFormSection
