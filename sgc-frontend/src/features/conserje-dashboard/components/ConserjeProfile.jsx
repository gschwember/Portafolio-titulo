import { useNavigate } from 'react-router-dom'
import { APP_ROUTES } from '@app/routes'
import useAuth from '@features/auth/hooks/useAuth'
import { ProfileCard, ActionCard } from '@shared/ui'

const iconMeter = (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path
      d="M4.5 15a7.5 7.5 0 1115 0v3.75H4.5V15zm5.25-3h4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
    />
  </svg>
)

const iconReservations = (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path
      d="M8.25 3.75v2.25m7.5-2.25v2.25M4.5 9h15m-13.5 9h12a1.5 1.5 0 001.5-1.5V7.5A1.5 1.5 0 0018 6H6A1.5 1.5 0 004.5 7.5v9A1.5 1.5 0 006 18z"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
    />
  </svg>
)

const ConserjeProfile = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-emerald-500" />
      </div>
    )
  }

  const quickActions = [
    {
      title: 'Ingreso Medidores',
      desc: 'Registra el consumo mensual de agua y calefacción.',
      path: APP_ROUTES.conserjeMedidores,
      icon: iconMeter,
      isPrimary: true,
    },
    {
      title: 'Reservas',
      desc: 'Revisa solicitudes de espacios comunes en modo lectura.',
      path: APP_ROUTES.conserjeReservations,
      icon: iconReservations,
    },
  ]

  const displayName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email || 'Conserje'

  return (
    <div className="space-y-8">
      <ProfileCard
        name={displayName}
        role="Personal de Conserjeria"
        extraInfo={user?.email}
        status="Turno"
        balance="N/A"
      />

      <div>
        <h3 className="mb-4 text-lg font-bold text-stone-800">Herramientas Operativas</h3>
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

export default ConserjeProfile
