import { APP_ROUTES } from '@app/routes'
import { USER_ROLES } from '@features/auth/model/auth.constants'

const superAdminNavItems = [
  {
    label: 'Mi Perfil',
    to: APP_ROUTES.superadminDashboard,
  },
  {
    label: 'Gestión de reservas',
    to: APP_ROUTES.superadminReservations,
  },
  {
    label: 'Gestión de Usuarios',
    to: APP_ROUTES.superadminUsers,
  },
  {
    label: 'Condominios',
    to: APP_ROUTES.superadminCondominiums,
  },
  {
    label: 'Gestión de pagos',
    to: APP_ROUTES.superadminPayments,
  },
]

const roleOptions = [
  { value: USER_ROLES.superadmin, label: 'Super Admin' },
  { value: USER_ROLES.admin, label: 'Administrador' },
  { value: USER_ROLES.conserje, label: 'Conserje' },
  { value: USER_ROLES.residente, label: 'Residente' },
]

export { roleOptions, superAdminNavItems }
