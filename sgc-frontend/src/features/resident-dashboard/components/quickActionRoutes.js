import { APP_ROUTES } from '@app/routes'

export const quickActionRoutes = {
  payments: APP_ROUTES.residentPayments,
  history: `${APP_ROUTES.residentPayments}#historial`,
  reservas: APP_ROUTES.residentReservations
}
