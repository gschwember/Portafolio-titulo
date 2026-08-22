import { useNavigate } from 'react-router-dom'
import { APP_ROUTES } from '@app/routes'
import useAuth from '@features/auth/hooks/useAuth'
import { ActionCard, ProfileCard } from '@shared/ui'

const iconUsers = (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path
      d="M17 20a5 5 0 00-10 0m10 0h3m-3 0H7m5-8a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
    />
  </svg>
)

const iconUserPlus = (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path
      d="M16 19a4 4 0 10-8 0m4-7a3 3 0 100-6 3 3 0 000 6zm7 1v6m3-3h-6"
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

const SuperAdminProfile = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-stone-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  const realName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Super Admin'

  const quickActions = [
    {
      title: 'Directorio de Usuarios',
      desc: 'Administra cuentas, roles y accesos.',
      path: APP_ROUTES.superadminUsers,
      icon: iconUsers,
      isPrimary: true,
    },
    {
      title: 'Crear Usuario',
      desc: 'Crea usuarios residentes y backoffice.',
      path: APP_ROUTES.superadminUsers,
      icon: iconUserPlus,
      state: { openCreateModal: true },
    },
    {
      title: 'Condominios',
      desc: 'Administra condominios y su estructura.',
      path: APP_ROUTES.superadminCondominiums,
      icon: iconCondo,
    },
  ]

  return (
    <div className="space-y-8">
      <ProfileCard
        name={realName}
        role="Super Administrador"
        extraInfo={user?.email}
        status="Activo"
        balance="N/A"
      />

      <div>
        <h3 className="text-lg font-bold text-stone-800 mb-4">Herramientas del Sistema</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <ActionCard
              key={action.title}
              title={action.title}
              description={action.desc}
              icon={action.icon}
              isPrimary={action.isPrimary}
              onClick={() => navigate(action.path, { state: action.state })}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default SuperAdminProfile
