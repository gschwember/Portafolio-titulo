// Rutas centralizadas para evitar strings duplicados en toda la app.
export const APP_ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  registerPending: '/registro-en-revision',
  unauthorized: '/unauthorized',

  residentDashboard: '/resident/dashboard',
  residentPayments: '/resident/pagos',
  residentReservations: '/resident/reservas',

  adminDashboard: '/admin/dashboard',
  adminResumen: '/admin/resumen',
  adminPayments: '/admin/pagos',
  adminStatement: '/admin/estado-cuenta',
  adminMonthClose: '/admin/cierre-mes',
  adminCondominiums: '/admin/condominios',
  
  conserjeDashboard: '/conserje/dashboard',
  conserjeMedidores: '/conserje/medidores',
  conserjeReservations: '/conserje/reservas',

  superadminDashboard: '/superadmin/dashboard',
  superadminReservations: '/superadmin/reservas',
  superadminUsers: '/superadmin/usuarios',
  superadminCondominiums: '/superadmin/condominios',
  superadminPayments: '/superadmin/pagos',
  
}
