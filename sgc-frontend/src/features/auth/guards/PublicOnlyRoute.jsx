import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { getHomeRouteByRole } from '../model/roleRedirect'
import { APP_ROUTES } from '@app/routes'

const PublicOnlyRoute = () => {
  const location = useLocation()
  const { isAuthenticated, isAccountApproved, user } = useAuth()

  if (!isAccountApproved && location.pathname === APP_ROUTES.registerPending) {
    return <Outlet />
  }

  if (!isAccountApproved) {
    return <Navigate to={APP_ROUTES.registerPending} replace />
  }

  if (isAuthenticated) {
    return <Navigate to={getHomeRouteByRole(user?.role)} replace />
  }

  return <Outlet />
}

export default PublicOnlyRoute
