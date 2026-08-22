import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, Outlet } from 'react-router-dom'
import ProtectedRoute from '@features/auth/guards/ProtectedRoute'
import PublicOnlyRoute from '@features/auth/guards/PublicOnlyRoute'
import HomeRedirect from '@features/auth/guards/HomeRedirect'
import { USER_ROLES } from '@features/auth/model/auth.constants'
import { CondominiumProvider } from '@features/condominium-management/context/CondominiumProvider'

import { APP_ROUTES } from './routes'

const WelcomePage = lazy(() => import('@pages/WelcomePage'))
const LoginPage = lazy(() => import('@pages/LoginPage'))
const RegisterPage = lazy(() => import('@pages/RegisterPage'))
const RegisterPendingPage = lazy(() => import('@pages/RegisterPendingPage'))
const ResidentDashboardPage = lazy(() => import('@pages/ResidentDashboardPage'))
const ResidentPaymentsPage = lazy(() => import('@pages/ResidentPaymentsPage'))
const ResidentReservationsPage = lazy(() => import('@pages/ResidentReservationsPage'))
const ConserjeDashboardPage = lazy(() => import('@pages/ConserjeDashboardPage'))
const ConserjeMedidoresPage = lazy(() => import('@pages/ConserjeMedidoresPage'))
const ConserjeReservationsPage = lazy(() => import('@pages/ConserjeReservationsPage'))
const SuperAdminDashboardPage = lazy(() => import('@pages/SuperAdminDashboardPage'))
const SuperAdminUsersPage = lazy(() => import('@pages/SuperAdminUsersPage'))
const UnauthorizedPage = lazy(() => import('@pages/UnauthorizedPage'))
const AdminDashboardPage = lazy(() => import('@pages/AdminDashboardPage'))
const AdminResumenPage = lazy(() => import('@pages/AdminResumenPage'))
const AdminPagosPage = lazy(() => import('@pages/AdminPagosPage'))
const AdminEstadoCuentaPage = lazy(() => import('@pages/AdminEstadoCuentaPage'))
const AdminCierreMesPage = lazy(() => import('@pages/AdminCierreMesPage'))
const SuperAdminReservationsPage = lazy(() => import('@pages/SuperAdminReservationsPage'))
const AdminCondominiumsPage = lazy(() => import('@pages/AdminCondominiumsPage'))
const SuperAdminCondominiumsPage = lazy(() => import('@pages/SuperAdminCondominiumsPage'))
const SuperAdminPaymentsPage = lazy(() => import('@pages/SuperAdminPaymentsPage'))

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-stone-50" role="status" aria-live="polite">
    <div className="flex items-center gap-3 text-sm font-semibold text-stone-600">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-amber-600" />
      Cargando módulo…
    </div>
  </div>
)

const AppRouter = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
      <Route path={APP_ROUTES.home} element={<WelcomePage />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path={APP_ROUTES.login} element={<LoginPage />} />
        <Route path={APP_ROUTES.register} element={<RegisterPage />} />
        <Route path={APP_ROUTES.registerPending} element={<RegisterPendingPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.residente]} />}>
        <Route path={APP_ROUTES.residentDashboard} element={<ResidentDashboardPage />} />
        <Route path={APP_ROUTES.residentPayments} element={<ResidentPaymentsPage />} />
        <Route path={APP_ROUTES.residentReservations} element={<ResidentReservationsPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.admin]} />}>

        <Route element={
          <CondominiumProvider>
            <Outlet /> 
          </CondominiumProvider>
        }>
          <Route path={APP_ROUTES.adminDashboard} element={<AdminDashboardPage />} />
          <Route path={APP_ROUTES.adminResumen} element={<AdminResumenPage />} />
          <Route path={APP_ROUTES.adminPayments} element={<AdminPagosPage />} />
          <Route path={APP_ROUTES.adminStatement} element={<AdminEstadoCuentaPage />} />
          <Route path={APP_ROUTES.adminMonthClose} element={<AdminCierreMesPage />} />
          <Route path={APP_ROUTES.adminCondominiums} element={<AdminCondominiumsPage />} />
        </Route>
      </Route>

      {/* RUTAS DEL CONSERJE */}
      <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.conserje]} />}>
        <Route element={
          <CondominiumProvider>
            <Outlet />
          </CondominiumProvider>
        }>
          <Route path={APP_ROUTES.conserjeDashboard} element={<ConserjeDashboardPage />} />
          <Route path={APP_ROUTES.conserjeMedidores} element={<ConserjeMedidoresPage />} />
          <Route path={APP_ROUTES.conserjeReservations} element={<ConserjeReservationsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.superadmin]} />}>
        <Route path={APP_ROUTES.superadminDashboard} element={<SuperAdminDashboardPage />} />
        <Route path={APP_ROUTES.superadminReservations} element={<SuperAdminReservationsPage />} />
        <Route path={APP_ROUTES.superadminUsers} element={<SuperAdminUsersPage />} />
        <Route path={APP_ROUTES.superadminCondominiums} element={<SuperAdminCondominiumsPage />} />
        <Route path={APP_ROUTES.superadminPayments} element={<SuperAdminPaymentsPage />} />
      </Route>


      <Route path={APP_ROUTES.unauthorized} element={<UnauthorizedPage />} />
      <Route path="*" element={<Navigate to={APP_ROUTES.home} replace />} />
      </Routes>
    </Suspense>
  )
}

export default AppRouter
