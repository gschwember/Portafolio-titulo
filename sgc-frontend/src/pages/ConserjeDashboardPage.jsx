import { Link } from 'react-router-dom'
import { APP_ROUTES } from '@app/routes'
import DashboardLayout from '@shared/ui/DashboardLayout'
import ConserjeProfile from '@features/conserje-dashboard/components/ConserjeProfile'
import { conserjeNavItems } from '@features/conserje-dashboard/data/conserjeDashboardData'
import useAuth from '@features/auth/hooks/useAuth'

const ConserjeDashboardPage = () => {
  const { user } = useAuth()
  const realName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Conserjeria'

  return (
    <DashboardLayout navItems={conserjeNavItems} title='Inicio - Conserjeria' userRole="Conserjeria" userName={realName}>
      <div className='w-full max-w-5xl mx-auto pb-8'>
        
        <div className='mb-6'>
          <h2 className='text-2xl font-bold text-stone-900'>Bienvenido/a</h2>
          <p className='text-stone-500 mt-1'>Desde aqui puedes acceder a tus herramientas operativas.</p>
        </div>


        <div className='mb-6'>
          <ConserjeProfile />
        </div>


        <div className='rounded-xl border border-stone-200 bg-white p-5 shadow-sm'>
          <h3 className='text-lg font-bold text-stone-900'>Reservas de espacios comunes</h3>
          <p className='mt-1 text-stone-600'>Vista consolidada de reservas para conserjeria en modo solo lectura.</p>
          <Link
            to={APP_ROUTES.conserjeReservations}
            className='mt-4 inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-amber-700'
          >
            Ver reservas
          </Link>
        </div>

      </div>
    </DashboardLayout>
  )
}

export default ConserjeDashboardPage