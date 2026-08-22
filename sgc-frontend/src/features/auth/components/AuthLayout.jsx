import logo from '../../../assets/logo_app_portafolio.png';

const AuthLayout = ({ title, subtitle, children, footer }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 via-stone-50 to-amber-50 px-4 py-10">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="hidden lg:block animate-fade-in-up">
          <div className="surface-panel-soft p-9">
            <span className="status-chip border-amber-200 bg-amber-100 text-amber-800">Sistema SGC</span>
            <h2 className="mb-3 mt-4 text-4xl font-black leading-tight text-stone-900">
              Gestión profesional para comunidades y condominios.
            </h2>
            <p className="m-0 text-base text-stone-600">
              Controla pagos, reservas, usuarios y operación diaria desde una sola plataforma segura.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-stone-200 bg-white p-3">
                <p className="m-0 text-xs font-semibold uppercase tracking-wide text-stone-500">Pagos</p>
                <p className="m-0 mt-1 font-bold text-stone-800">Validación centralizada</p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-3">
                <p className="m-0 text-xs font-semibold uppercase tracking-wide text-stone-500">Reservas</p>
                <p className="m-0 mt-1 font-bold text-stone-800">Agenda y control de cupos</p>
              </div>
            </div>
          </div>
        </section>

        <div className="surface-panel w-full max-w-md justify-self-center p-8 animate-fade-in-up">
          <header className="mb-6 text-center">
            <div className="mb-2 flex justify-center">
              <img src={logo} alt="Logo SGC" className="max-h-20 w-auto" />
            </div>
            <h1 className="text-2xl font-extrabold text-stone-900">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-stone-600">{subtitle}</p>}
          </header>

          {children}

          {footer && <footer className="mt-6 text-center text-sm text-stone-600">{footer}</footer>}
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
