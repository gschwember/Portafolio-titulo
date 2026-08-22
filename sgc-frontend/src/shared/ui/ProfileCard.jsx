const ProfileCard = ({ name, role, extraInfo, status = 'Al dia', balance = '$0' }) => {
  const safeName = name?.trim() || 'Usuario sin registrar'
  const initial = safeName.charAt(0).toUpperCase()
  const isPositiveStatus = ['al dia', 'activo', 'turno'].includes(String(status).toLowerCase())

  return (
    <div className="surface-panel-soft interactive-lift flex flex-col items-start justify-between gap-6 p-5 md:flex-row md:items-center md:p-6">
      <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-amber-600 bg-stone-100 text-xl font-bold text-stone-700 shadow-inner sm:h-16 sm:w-16 sm:text-2xl">
          {initial}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="text-lg sm:text-xl font-bold text-stone-900 m-0 leading-tight truncate" title={safeName}>
            {safeName}
          </h2>
          <span className="mt-1 truncate text-xs font-semibold uppercase tracking-wide text-amber-700 sm:text-sm">
            {role || 'Rol no asignado'}
          </span>

          {extraInfo?.trim() && (
            <span className="mt-2 flex items-center gap-1.5 text-sm font-medium text-stone-600">
              <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-amber-600 bg-amber-100">
                <svg className="h-2.5 w-2.5 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    d="M4 6h16M4 12h16M4 18h16"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </span>
              <span className="truncate" title={extraInfo}>
                {extraInfo}
              </span>
            </span>
          )}
        </div>
      </div>

      <div className="flex w-full flex-row justify-between gap-4 border-t border-stone-200 pt-4 md:w-auto md:flex-col md:justify-center md:gap-2 md:border-l md:border-t-0 md:pl-8 md:pt-0 md:text-right">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Estado</span>
          <span
            className={`flex items-center gap-1.5 text-sm font-bold md:justify-end ${
              isPositiveStatus ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${isPositiveStatus ? 'bg-emerald-500' : 'bg-rose-500 animate-soft-pulse'}`} />
            {status}
          </span>
        </div>

        <div className="mt-0 flex flex-col md:mt-2">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Saldo adeudado</span>
          <span className="mt-1 text-xl font-extrabold leading-none text-stone-900 md:text-2xl">{balance}</span>
        </div>
      </div>
    </div>
  )
}

export default ProfileCard
