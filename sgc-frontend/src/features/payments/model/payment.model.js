export const paymentStatus = {
  approved: 'Aprobado',
  pending: 'Pendiente',
  rejected: 'Rechazado',
}

export const paymentHistoryMock = [
  {
    periodo: 'Marzo 2026',
    fecha: '05/03/2026',
    monto: '$85.400',
    estado: paymentStatus.pending,
    comprobante: 'TR-99812.pdf',
  },
  {
    periodo: 'Febrero 2026',
    fecha: '12/02/2026',
    monto: '$82.100',
    estado: paymentStatus.approved,
    comprobante: 'TR-88124.pdf',
  },
  {
    periodo: 'Enero 2026',
    fecha: '03/01/2026',
    monto: '$90.500',
    estado: paymentStatus.approved,
    comprobante: '',
  },
]
