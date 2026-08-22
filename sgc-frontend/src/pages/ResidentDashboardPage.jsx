import { useNavigate } from 'react-router-dom'
import DashboardLayout from '@shared/ui/DashboardLayout'
import { quickActionRoutes } from '@features/resident-dashboard/components/quickActionRoutes'
import {
  ContactFormSection,
  QuickActionsSection,
  ResidentOverviewSection,
} from '@widgets/resident-dashboard'

// 1. Eliminamos todas las importaciones de datos falsos (mock)
import { residentNavItems } from '@features/resident-dashboard/data/dashboardData'
import useAuth from '@features/auth/hooks/useAuth'

const ResidentDashboardPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  // 2. Nombre e info real del usuario conectado
  const realName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Cargando perfil...'

  const dynamicProfileData = [{
    id: user?.id || 1,
    name: realName,
    role: 'Residente', 
    extraInfo: user?.email || 'Sin correo registrado',
    status: 'Al día', // Pronto lo conectaremos a tu backend real
    balance: '$0'     // Pronto lo conectaremos a tu backend real
  }]



  return (
    <DashboardLayout
      userRole="Residente"
      userName={realName}
      title="Portal Residente"
      navItems={residentNavItems}
    >
      {/* Redujimos el ancho a max-w-4xl para que se vea más ordenado al quitar la tabla */}
      <div className="max-w-4xl mx-auto pb-12">
        
        <ResidentOverviewSection profiles={dynamicProfileData} />

        <QuickActionsSection
          onGoToReservations={() => navigate(quickActionRoutes.reservas)}
          onGoToPayments={() => navigate(quickActionRoutes.payments)}
          onGoToHistory={() => navigate(quickActionRoutes.history)}
        />

        <div className="mt-8 flex flex-col gap-8">
          
          {/* Banner central para redirigir al módulo real de pagos */}
          <section className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm text-center">
            <h2 className="text-xl font-bold text-stone-900 uppercase tracking-wide mb-3">
              Módulo de Pagos
            </h2>
            <p className="text-sm text-stone-600 mb-6">
              Revisa tus deudas actuales, gastos comunes pendientes y sube tus comprobantes de transferencia de forma conectada con la administración.
            </p>
            <button
              type="button"
              onClick={() => navigate(quickActionRoutes.payments)}
              className="rounded-lg bg-stone-900 px-8 py-3 text-sm font-bold text-stone-50 hover:bg-stone-800 transition-colors"
            >
              Ir a Pagar mis Gastos Comunes
            </button>
          </section>

          {/* Formulario de contacto (Mensajes al conserje/admin) */}
          <ContactFormSection />
          
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ResidentDashboardPage