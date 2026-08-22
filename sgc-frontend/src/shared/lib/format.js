const formatCurrencyCLP = (value) => {
  const numericValue = Number(value)

  if (Number.isNaN(numericValue)) {
    return '$0'
  }

  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(numericValue)
}

export { formatCurrencyCLP }
