import DashboardLayout from '@shared/ui/DashboardLayout'
import useAuth from '@features/auth/hooks/useAuth'
import ValidacionPagos from '@features/admin-dashboard/components/ValidacionPagos'
import { CondominiumProvider } from '@features/condominium-management/context/CondominiumProvider'
import { superAdminNavItems } from '@features/superadmin-dashboard/data/superAdminDashboardData'

const SuperAdminPaymentsPage = () => {
  const { user } = useAuth()
  const realName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Super Admin'

  return (
    <DashboardLayout
      navItems={superAdminNavItems}
      title="Gestión de Pagos"
      userRole="Super Administrador"
      userName={realName}
    >
      <div className="w-full max-w-7xl mx-auto pb-10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-stone-900">Gestión de Pagos</h2>
          <p className="text-stone-500 mt-1">
            Supervisa validación, seguimiento y revisión global de comprobantes de pago.
          </p>
        </div>

        <CondominiumProvider>
          <ValidacionPagos />
        </CondominiumProvider>
      </div>
    </DashboardLayout>
  )
}

export default SuperAdminPaymentsPage
