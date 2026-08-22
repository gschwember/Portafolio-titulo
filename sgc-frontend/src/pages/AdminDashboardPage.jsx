import DashboardLayout from '@shared/ui/DashboardLayout'
import AdminProfile from '@features/admin-dashboard/components/AdminProfile'
import { adminNavItems } from '@features/admin-dashboard/data/adminDashboardData'
import useAuth from '@features/auth/hooks/useAuth'

const AdminDashboardPage = () => {
  const { user } = useAuth()
  const realName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Administrador'

  return (
    <DashboardLayout 
      navItems={adminNavItems} 
      title="Inicio - Contabilidad"
      userRole="Administrador"
      userName={realName}
    >
      <div className="w-full max-w-6xl mx-auto pb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-stone-900">Bienvenido/a</h2>
          <p className="text-stone-500 mt-1">
            Desde aquí puedes acceder a todas tus herramientas de gestión.
          </p>
        </div>

        <AdminProfile />
      </div>
    </DashboardLayout>
  )
}

export default AdminDashboardPage
