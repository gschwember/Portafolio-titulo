import { formatCurrencyCLP } from '@shared/lib/format'

export const mapResident = (resident) => {
  return {
    ...resident,
    balance: formatCurrencyCLP(resident.balanceAmount || 0),
  }
}

export const residentMockList = [
  {
    id: 'resident-1',
    name: 'Juan Perez',
    role: 'Residente titular',
    extraInfo: 'Departamento 402 - Torre B',
    status: 'Al dia',
    balanceAmount: 0,
  },
  {
    id: 'resident-2',
    name: 'Pedro Gonzales',
    role: 'Residente titular',
    extraInfo: 'Departamento 403 - Torre A',
    status: 'Pendiente',
    balanceAmount: 12400,
  },
]
