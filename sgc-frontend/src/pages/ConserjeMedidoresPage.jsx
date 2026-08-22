import DashboardLayout from '@shared/ui/DashboardLayout'
import IngresoMedidores from '@features/conserje-dashboard/components/IngresoMedidores'
import { conserjeNavItems } from '@features/conserje-dashboard/data/conserjeDashboardData'
import useAuth from '@features/auth/hooks/useAuth'

const ConserjeMedidoresPage = () => {
  const { user } = useAuth()
  const realName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Conserjeria'

  return (
    <DashboardLayout navItems={conserjeNavItems} title="Perfil Conserjeria" userRole="Conserjeria" userName={realName}>
      <div className="mx-auto w-full max-w-5xl pb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-stone-900">Ronda de Medidores</h2>
          <p className="mt-1 text-stone-500">
            Ingresa las lecturas mensuales. El sistema calcula el consumo y lo envia a contabilidad.
          </p>
        </div>

        <IngresoMedidores />
      </div>
    </DashboardLayout>
  )
}

export default ConserjeMedidoresPage
