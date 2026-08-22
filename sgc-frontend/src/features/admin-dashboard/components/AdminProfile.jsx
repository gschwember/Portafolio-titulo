import { useNavigate } from 'react-router-dom'
import { APP_ROUTES } from '@app/routes'
import useAuth from '@features/auth/hooks/useAuth'
import { ActionCard, ProfileCard } from '@shared/ui'

const iconChart = (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M5 19h14M7 17V8m5 9V5m5 12v-6" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} />
  </svg>
)

const iconPayment = (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path
      d="M4 7.5h16v9H4v-9zm0 2.25h16M8 13h2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
    />
  </svg>
)

const iconStatement = (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path
      d="M7 4h10l2 2v14H5V4h2zm3 5h5m-5 4h5m-5 4h5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
    />
  </svg>
)

const iconCloseMonth = (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path
      d="M12 8.25v3.75m0 3h.008m8.242-3a8.25 8.25 0 11-16.5 0 8.25 8.25 0 0116.5 0z"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
    />
  </svg>
)

const iconCondo = (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path
      d="M3.75 19.5h16.5M6 19.5V7.5h3v12m3-12v12m3-12h3v12M7.5 3.75h9v3.75h-9V3.75z"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
    />
  </svg>
)

const AdminProfile = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  const quickActions = [
    {
      title: 'Resumen Financiero',
      desc: 'Revisa metricas globales y morosidad.',
      path: APP_ROUTES.adminResumen,
      icon: iconChart,
      isPrimary: true,
    },
    {
      title: 'Validar Pagos',
      desc: 'Aprueba o rechaza transferencias pendientes.',
      path: APP_ROUTES.adminPayments,
      icon: iconPayment,
    },
    {
      title: 'Estado de Cuenta',
      desc: 'Consulta el historial por departamento.',
      path: APP_ROUTES.adminStatement,
      icon: iconStatement,
    },
    {
      title: 'Cierre de Mes',
      desc: 'Ejecuta la facturacion mensual.',
      path: APP_ROUTES.adminMonthClose,
      icon: iconCloseMonth,
    },
    {
      title: 'Condominios',
      desc: 'Gestiona unidades, residentes y espacios.',
      path: APP_ROUTES.adminCondominiums,
      icon: iconCondo,
    },
  ]

  const displayName =
    `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email || 'Administrador'

  return (
    <div className="space-y-8">
      <ProfileCard
        name={displayName}
        role="Contabilidad y Finanzas"
        extraInfo={user?.email}
        status="Activo"
        balance="N/A"
      />

      <div>
        <h3 className="text-lg font-bold text-stone-800 mb-4">Accesos Directos</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <ActionCard
              key={action.title}
              title={action.title}
              description={action.desc}
              icon={action.icon}
              isPrimary={action.isPrimary}
              onClick={() => navigate(action.path)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminProfile
