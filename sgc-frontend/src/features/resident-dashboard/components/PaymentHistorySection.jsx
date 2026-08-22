import DataTable from '@shared/ui/DataTable'

const PaymentHistorySection = ({
  columns,
  data,
  sectionId = 'seccion-historial',
  isLoading = false,
  onRefresh,
  emptyMessage = 'Aún no tienes pagos registrados en este período.',
}) => {
  return (
    <section id={sectionId} className="lg:col-span-7">
      <div className="mb-5 flex items-end justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold uppercase tracking-wide text-stone-900">
          <span className="w-2 h-6 bg-stone-900 rounded-sm" />
          Historial de pagos
        </h2>
        <button
          type="button"
          onClick={onRefresh}
          className="btn-secondary px-3 py-2 text-xs sm:text-sm"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M16.5 10.5h4.5V6m0 4.5A7.5 7.5 0 106.3 18"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
            />
          </svg>
          Actualizar
        </button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        title="Historial de pagos del residente"
      />
    </section>
  )
}

export default PaymentHistorySection
