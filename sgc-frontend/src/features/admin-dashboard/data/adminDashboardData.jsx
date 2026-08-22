import { APP_ROUTES } from '@app/routes'
// Métricas globales para las tarjetas superiores del Dashboard
export const financialStats = {
  totalCollected: 2550000,
  totalPending: 850000,
  delinquencyRate: 15, // Porcentaje de morosidad
  activeUnits: 40
}

// Datos falsos para la tabla de Gastos Comunes
export const commonExpensesMock = [
  {
    id: 'gc-001',
    unit: '101',
    owner: 'Juan Pérez',
    amount: 85000,
    period: 'Marzo 2026',
    status: 'pagado',
    dueDate: '2026-03-05',
  },
  {
    id: 'gc-002',
    unit: '102',
    owner: 'María González',
    amount: 85000,
    period: 'Marzo 2026',
    status: 'pendiente',
    dueDate: '2026-03-05',
  },
  {
    id: 'gc-003',
    unit: '201',
    owner: 'Carlos Silva',
    amount: 170000, 
    period: 'Febrero-Marzo 2026',
    status: 'moroso',
    dueDate: '2026-02-05',
  },
  {
    id: 'gc-004',
    unit: '202',
    owner: 'Ana Rojas',
    amount: 85000,
    period: 'Marzo 2026',
    status: 'pagado',
    dueDate: '2026-03-05',
  },
  {
    id: 'gc-005',
    unit: '301',
    owner: 'Luis Soto',
    amount: 85000,
    period: 'Marzo 2026',
    status: 'pendiente',
    dueDate: '2026-03-05',
  }
]

// Opciones para el filtro desplegable igual a SuperAdmin)
export const expenseStatusOptions = [
  { value: 'Todos', label: 'Todos los estados' },
  { value: 'pagado', label: 'Al día' },
  { value: 'pendiente', label: 'Por pagar' },
  { value: 'moroso', label: 'Moroso' }
]

// Opciones del menú lateral para el rol Admin (Contabilidad)
export const adminNavItems = [
  { 
    label: 'Mi Perfil', 
    to: APP_ROUTES.adminDashboard 
  },
  { 
    label: 'Resumen Financiero', 
    to: APP_ROUTES.adminResumen 
  },
  { 
    label: 'Validar Pagos', 
    to: APP_ROUTES.adminPayments 
  },
  { 
    label: 'Estado de Cuenta', 
    to: APP_ROUTES.adminStatement 
  },
  { 
    label: 'Cierre de Mes', 
    to: APP_ROUTES.adminMonthClose 
  },
  {
    label: 'Condominios',
    to: APP_ROUTES.adminCondominiums,
  }
]

// Mock para la bandeja de validación de pagos (transferencias por revisar)
export const pendingPaymentsMock = [
  {
    id: 'pay-001',
    unit: '102',
    owner: 'María González',
    amountDeclared: 85000,
    dateSubmitted: '2026-03-26',
    bankReference: 'TR-99887766',
    receiptUrl: 'https://ejemplo.com/comprobante-102.pdf',
    status: 'en_revision' // Estados posibles: en_revision, aprobado, rechazado
  },
  {
    id: 'pay-002',
    unit: '301',
    owner: 'Luis Soto',
    amountDeclared: 85000,
    dateSubmitted: '2026-03-27',
    bankReference: 'TR-11223344',
    receiptUrl: 'https://ejemplo.com/comprobante-301.png',
    status: 'en_revision'
  },
  {
    id: 'pay-003',
    unit: '201',
    owner: 'Carlos Silva',
    amountDeclared: 170000, // Pagó la deuda completa
    dateSubmitted: '2026-03-25',
    bankReference: 'TR-55443322',
    receiptUrl: 'https://ejemplo.com/comprobante-201.jpg',
    status: 'en_revision'
  }
]
