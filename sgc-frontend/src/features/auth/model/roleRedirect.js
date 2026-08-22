import { APP_ROUTES } from '@app/routes'
import { USER_ROLES } from './auth.constants'

const ROLE_HOME_ROUTES = {
  [USER_ROLES.superadmin]: APP_ROUTES.superadminDashboard,
  [USER_ROLES.admin]: APP_ROUTES.adminDashboard,
  [USER_ROLES.conserje]: APP_ROUTES.conserjeDashboard,
  [USER_ROLES.residente]: APP_ROUTES.residentDashboard,
}

const getHomeRouteByRole = (role) => {
  const normalizedRole = String(role || USER_ROLES.residente).toLowerCase()
  return ROLE_HOME_ROUTES[normalizedRole] || APP_ROUTES.residentDashboard
}

export { getHomeRouteByRole, ROLE_HOME_ROUTES }
