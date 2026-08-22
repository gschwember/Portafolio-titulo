import DashboardLayout from '@shared/ui/DashboardLayout'
import ResumenFinanciero from '@features/admin-dashboard/components/ResumenFinanciero'
import { adminNavItems } from '@features/admin-dashboard/data/adminDashboardData'
import useAuth from '@features/auth/hooks/useAuth'

const AdminResumenPage = () => {
  const { user } = useAuth()
  const realName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Administrador'

  return (
    <DashboardLayout 
      navItems={adminNavItems} 
      title="Perfil Contabilidad"
      userRole="Administrador"
      userName={realName}
    >
      <div className="w-full max-w-7xl mx-auto pb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-stone-900">Resumen Financiero</h2>
          <p className="text-stone-500 mt-1">
            Transparencia y control general de gastos comunes y morosidad.
          </p>
        </div>

        {/* Aquí cargamos la tabla grande que teníamos antes */}
        <ResumenFinanciero />
      </div>
    </DashboardLayout>
  )
}

export default AdminResumenPage
