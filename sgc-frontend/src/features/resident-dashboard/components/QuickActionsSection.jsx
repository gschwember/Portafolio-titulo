import ActionCard from '@shared/ui/ActionCard'

const iconCalendar = (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
  </svg>
)

const iconUpload = (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
    />
  </svg>
)

const iconHistory = (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
    />
  </svg>
)

const QuickActionsSection = ({ onGoToReservations, onGoToPayments, onGoToHistory }) => {
  return (
    <section className="mb-12 animate-fade-in-up">
      <h2 className="mb-5 flex items-center gap-2 text-lg font-bold uppercase tracking-wide text-stone-900">
        <span className="w-2 h-6 bg-amber-600 rounded-sm" />
        Acciones frecuentes
      </h2>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
        <ActionCard
          title="Reservar Espacios"
          description="Reserva espacios comunes como quincho, piscina, etc"
          icon={iconCalendar}
          onClick={onGoToReservations}
        />
        <ActionCard
          title="Informar pago"
          description="Sube el comprobante de tu transferencia para validación."
          icon={iconUpload}
          isPrimary
          onClick={onGoToPayments}
        />
        <ActionCard
          title="Historial de pagos"
          description="Revisa el registro y estado de tus comprobantes anteriores."
          icon={iconHistory}
          onClick={onGoToHistory}
        />
      </div>
    </section>
  )
}

export default QuickActionsSection
