import { useEffect, useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import useAuth from '@features/auth/hooks/useAuth'
import { getEconomicIndicatorsRequest } from '@shared/api/public.api'
import backgroundImage from '../../assets/condominio.jpg'

const iconByLabel = {
  perfil: (
    <path
      d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zm-10.5 12a6.75 6.75 0 1113.5 0"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
    />
  ),
  pagos: (
    <path
      d="M3.75 7.5h16.5v9H3.75v-9zm0 2.25h16.5M7.5 13.5h2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
    />
  ),
  reservas: (
    <path
      d="M8.25 3.75v2.25m7.5-2.25v2.25M4.5 9h15m-13.5 9h12a1.5 1.5 0 001.5-1.5V7.5A1.5 1.5 0 0018 6H6A1.5 1.5 0 004.5 7.5v9A1.5 1.5 0 006 18z"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
    />
  ),
  usuarios: (
    <path
      d="M15 19.5a6 6 0 10-6 0m6 0H9m6 0a6 6 0 016 6m-12 0a6 6 0 00-6 6"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
    />
  ),
  resumen: (
    <path
      d="M5.25 19.5h13.5M6.75 16.5V8.25m5.25 8.25v-12m5.25 12V11.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
    />
  ),
  cierre: (
    <path
      d="M12 8.25v4.5m0 3h.008m8.242-3a8.25 8.25 0 11-16.5 0 8.25 8.25 0 0116.5 0z"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
    />
  ),
  condominio: (
    <path
      d="M3.75 19.5h16.5M6 19.5V7.5h3v12m3-12v12m3-12h3v12M7.5 3.75h9v3.75h-9V3.75z"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
    />
  ),
  medidor: (
    <path
      d="M4.5 15a7.5 7.5 0 1115 0v3.75H4.5V15zm5.25-3h4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
    />
  ),
}

const normalizeLabel = (value = '') => String(value).toLowerCase()

const getIconForItem = (item) => {
  if (item?.icon) {
    return item.icon
  }

  const label = normalizeLabel(item?.label)

  if (label.includes('perfil')) return iconByLabel.perfil
  if (label.includes('pago')) return iconByLabel.pagos
  if (label.includes('reserva')) return iconByLabel.reservas
  if (label.includes('usuario')) return iconByLabel.usuarios
  if (label.includes('resumen')) return iconByLabel.resumen
  if (label.includes('cierre')) return iconByLabel.cierre
  if (label.includes('condominio')) return iconByLabel.condominio
  if (label.includes('medidor')) return iconByLabel.medidor
  return iconByLabel.perfil
}

const DashboardLayout = ({ children, userRole, userName, title, navItems = [] }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [indicators, setIndicators] = useState({ uf: null, utm: null })

  const safeUserName = userName?.trim() || 'Usuario SGC'
  const safeRole = userRole?.trim() || 'Perfil'
  const safeTitle = title?.trim() || `Portal ${safeRole}`

  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    const syncViewport = (matches) => {
      setIsDesktop(matches)
      setIsSidebarOpen(matches)
    }

    syncViewport(mediaQuery.matches)
    const listener = (event) => syncViewport(event.matches)
    mediaQuery.addEventListener('change', listener)
    return () => mediaQuery.removeEventListener('change', listener)
  }, [])

  useEffect(() => {
    let mounted = true

    const loadIndicators = async () => {
      try {
        const response = await getEconomicIndicatorsRequest()
        if (!mounted) return
        setIndicators({
          uf: response?.uf?.value ?? null,
          utm: response?.utm?.value ?? null,
        })
      } catch {
        if (!mounted) return
        setIndicators({ uf: null, utm: null })
      }
    }

    loadIndicators()
    const interval = window.setInterval(loadIndicators, 10 * 60 * 1000)
    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [])

  const formatIndicator = (value) => {
    if (value === null || value === undefined) {
      return '-'
    }
    return new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const normalizedNavItems = useMemo(() => {
    if (!Array.isArray(navItems) || navItems.length === 0) {
      return [{ label: 'Panel principal', to: '/' }]
    }
    return navItems
  }, [navItems])

  const toggleSidebar = () => {
    setIsSidebarOpen((previous) => !previous)
  }

  const closeSidebar = () => {
    if (!isDesktop) {
      setIsSidebarOpen(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden text-stone-900">
      <div className="absolute inset-0">
        <img src={backgroundImage} alt="Fondo condominio" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-stone-950/55 via-stone-950/35 to-amber-950/45" />
      </div>

      <div className="relative z-10 flex min-h-screen w-full flex-col backdrop-blur-[1px]">
        <header className="sticky top-0 z-30 h-[72px] border-b border-stone-200 bg-stone-50/95 px-4 shadow-sm md:px-6">
          <div className="flex h-full items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={toggleSidebar}
                className="btn-secondary px-3 py-2"
                aria-label={isSidebarOpen ? 'Ocultar menu lateral' : 'Mostrar menu lateral'}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="hidden h-10 w-10 items-center justify-center rounded-lg bg-amber-700 text-sm font-black tracking-widest text-white shadow-sm sm:flex">
                SGC
              </div>
              <div className="min-w-0">
                <p className="m-0 truncate text-sm font-semibold uppercase tracking-wide text-stone-500">{safeRole}</p>
                <h1 className="m-0 truncate text-base font-black text-stone-900 sm:text-lg">{safeTitle}</h1>
                <p className="m-0 mt-0.5 text-[11px] font-semibold text-stone-500">
                  UF: {formatIndicator(indicators.uf)} | UTM: {formatIndicator(indicators.utm)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-l border-stone-200 pl-3 md:pl-5">
              <div className="hidden text-right sm:block">
                <p className="m-0 text-xs font-semibold text-stone-500">Sesion activa</p>
                <p className="m-0 max-w-[210px] truncate text-sm font-bold text-stone-800" title={safeUserName}>
                  {safeUserName}
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-stone-100 bg-amber-700 text-sm font-bold text-amber-50 shadow-sm">
                {safeUserName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="relative flex flex-1 overflow-hidden">
          <aside
            className={`absolute bottom-0 top-0 z-30 h-full w-72 shrink-0 border-r border-stone-700/50 bg-stone-900/95 shadow-xl transition-transform duration-300 ease-out lg:relative lg:w-72 ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}
          >
            <div className="flex h-full flex-col">
              <div className="border-b border-stone-700/70 px-5 py-4">
                <p className="m-0 text-xs font-semibold uppercase tracking-wider text-stone-400">Menu principal</p>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="m-0 list-none space-y-2 p-0">
                  {normalizedNavItems.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        onClick={closeSidebar}
                        className={({ isActive }) =>
                          `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all ${
                            isActive
                              ? 'bg-amber-600 text-amber-50 shadow-md shadow-amber-900/20'
                              : 'text-stone-300 hover:bg-stone-800/80 hover:text-stone-100'
                          }`
                        }
                      >
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-black/10">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            {getIconForItem(item)}
                          </svg>
                        </span>
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="mt-auto border-t border-stone-700/50 p-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-stone-300 transition-all hover:bg-red-500/10 hover:text-red-300"
                >
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-black/10">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m-6-3h10.5m0 0l-3-3m3 3l-3 3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                      />
                    </svg>
                  </span>
                  Cerrar sesión
                </button>
              </div>
            </div>
          </aside>

          {isSidebarOpen && !isDesktop && (
            <button
              type="button"
              aria-label="Cerrar menu lateral"
              onClick={closeSidebar}
              className="absolute inset-0 z-20 bg-black/40 backdrop-blur-[1px] lg:hidden"
            />
          )}

          <section className="relative z-10 flex min-w-0 flex-1 flex-col overflow-y-auto bg-stone-50/90">
            <main className="flex-1 p-4 md:p-6 lg:p-8">
              <div className="mx-auto w-full max-w-7xl animate-fade-in-up">{children}</div>
            </main>
          </section>
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
