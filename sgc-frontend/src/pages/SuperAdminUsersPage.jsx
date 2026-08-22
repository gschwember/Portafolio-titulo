import DashboardLayout from '@shared/ui/DashboardLayout'
import useAuth from '@features/auth/hooks/useAuth'
import { UserManagementSection } from '@widgets/superadmin-dashboard'
import { superAdminNavItems } from '@features/superadmin-dashboard/data/superAdminDashboardData'

const SuperAdminUsersPage = () => {
  const { user } = useAuth()
  const realName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Super Admin'

  return (
    <DashboardLayout
      userRole="Super Administrador"
      userName={realName}
      title="Directorio de Cuentas"
      navItems={superAdminNavItems}
    >
      <div className="max-w-7xl mx-auto pb-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-stone-900">Gestión de Usuarios</h2>
          <p className="text-stone-500 mt-1">
            Crea, edita o elimina cuentas de residentes, conserjes y administradores.
          </p>
        </div>
        {/* Aquí sobrevive el CRUD intacto de tu compañero */}
        <UserManagementSection />
      </div>
    </DashboardLayout>
  )
}

export default SuperAdminUsersPage