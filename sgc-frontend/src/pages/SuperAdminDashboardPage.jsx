import DashboardLayout from '@shared/ui/DashboardLayout'
import useAuth from '@features/auth/hooks/useAuth'
import SuperAdminProfile from '@features/superadmin-dashboard/components/SuperadminProfile'
import { superAdminNavItems } from '@features/superadmin-dashboard/data/superAdminDashboardData'

const SuperAdminDashboardPage = () => {
  const { user } = useAuth()
  const realName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Super Admin'

  return (
    <DashboardLayout
      userRole="Super Administrador"
      userName={realName}
      title="Inicio - Sistema"
      navItems={superAdminNavItems}
    >
      <div className="max-w-6xl mx-auto pb-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-stone-900">Panel de Control Global</h2>
          <p className="text-stone-500 mt-1">
            Desde aquí puedes administrar toda la plataforma SGC.
          </p>
        </div>
        
        {/* AQUÍ SE RENDERIZA EL PERFIL CON TUS BOTONES NUEVOS */}
        <SuperAdminProfile /> 
        
      </div>
    </DashboardLayout>
  )
}

export default SuperAdminDashboardPage
