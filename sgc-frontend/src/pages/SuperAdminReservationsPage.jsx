import DashboardLayout from '@shared/ui/DashboardLayout'
import useAuth from '@features/auth/hooks/useAuth'
import { ReservationManagementSection } from '@widgets/superadmin-dashboard'
import { superAdminNavItems } from '@features/superadmin-dashboard/data/superAdminDashboardData'

const SuperAdminReservationsPage = () => {
  const { user } = useAuth()
  const realName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Super Admin'

  return (
    <DashboardLayout
      userRole="Super Administrador"
      userName={realName}
      title="Gestión de Reservas"
      navItems={superAdminNavItems}
    >
      <div className="max-w-7xl mx-auto pb-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight">Reservas de espacios comunes</h1>
          <p className="mt-2 text-base text-stone-600">
            Centraliza la administracion de reservas para piscina, sala multiuso y gimnasio.
          </p>
        </div>

        <ReservationManagementSection />
      </div>
    </DashboardLayout>
  )
}

export default SuperAdminReservationsPage
