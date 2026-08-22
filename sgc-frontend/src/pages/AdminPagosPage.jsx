import DashboardLayout from '@shared/ui/DashboardLayout'
import ValidacionPagos from '@features/admin-dashboard/components/ValidacionPagos'
import useAuth from '@features/auth/hooks/useAuth'
import { CondominiumProvider } from '@features/condominium-management/context/CondominiumProvider'
import { adminNavItems } from '@features/admin-dashboard/data/adminDashboardData'

const AdminPagosPage = () => {
  const { user } = useAuth()
  const realName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Administrador'

  return (
    <DashboardLayout navItems={adminNavItems} title="Gestión de Pagos" userRole="Administrador" userName={realName}>
      <div className="w-full max-w-7xl mx-auto pb-10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-stone-900">Gestión de Pagos</h2>
          <p className="text-stone-500 mt-1">
            Controla el flujo completo de pagos: validacion, seguimiento por estado y revision de comprobantes.
          </p>
        </div>

        <CondominiumProvider>
          <ValidacionPagos />
        </CondominiumProvider>
      </div>
    </DashboardLayout>
  )
}

export default AdminPagosPage
