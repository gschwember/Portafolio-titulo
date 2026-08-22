import DashboardLayout from '@shared/ui/DashboardLayout'
import useAuth from '@features/auth/hooks/useAuth'
import CondominiumManagementSection from '@features/condominium-management/components/CondominiumManagementSection'
import { CondominiumProvider } from '@features/condominium-management/context/CondominiumProvider'
import { adminNavItems } from '@features/admin-dashboard/data/adminDashboardData'

const AdminCondominiumsPage = () => {
  const { user } = useAuth()
  const realName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Administrador'

  return (
    <DashboardLayout
      userRole="Administrador"
      userName={realName}
      title="Gestión de Condominios"
      navItems={adminNavItems}
    >
      <div className="max-w-7xl mx-auto pb-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-stone-900">Configuración del Condominio</h2>
          <p className="mt-1 text-stone-500">Gestiona unidades, residentes y espacios comunes para el condominio activo.</p>
        </div>
        <CondominiumProvider>
          <CondominiumManagementSection />
        </CondominiumProvider>
      </div>
    </DashboardLayout>
  )
}

export default AdminCondominiumsPage
