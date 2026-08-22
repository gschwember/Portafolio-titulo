const fallbackValue = <span className="text-xs italic text-stone-400">N/A</span>

const DataTable = ({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No hay registros para mostrar.',
  rowKey = 'id',
  title = 'Listado',
}) => {
  const safeData = Array.isArray(data) ? data : []
  const safeColumns = Array.isArray(columns) ? columns : []
  const colSpan = Math.max(1, safeColumns.length)

  const getCellValue = (row, col) => {
    if (typeof col.accessor === 'function') {
      return col.accessor(row)
    }
    return row[col.accessor] || fallbackValue
  }

  const getRowKey = (row, index) => {
    if (typeof rowKey === 'function') {
      return rowKey(row, index)
    }
    return row[rowKey] ?? `${index}-${row?.periodo || row?.id || 'row'}`
  }

  const renderLoading = (cellClassName) => (
    <tr>
      <td colSpan={colSpan} className={cellClassName}>
        <div className="flex items-center justify-center gap-2.5 text-sm font-semibold text-stone-600">
          <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-amber-200 border-t-amber-700" />
          Cargando datos...
        </div>
      </td>
    </tr>
  )

  const renderEmpty = (cellClassName) => (
    <tr>
      <td colSpan={colSpan} className={cellClassName}>
        <div className="flex flex-col items-center justify-center text-center">
          <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M9 12h6m-6 4h6m3-7.5L13.5 4H7.5A1.5 1.5 0 006 5.5v13A1.5 1.5 0 007.5 20h9a1.5 1.5 0 001.5-1.5V9.5z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
              />
            </svg>
          </span>
          <p className="m-0 text-sm font-semibold text-stone-800">{emptyMessage}</p>
          <p className="m-0 mt-1 text-xs text-stone-500">Cuando existan datos, apareceran en esta seccion.</p>
        </div>
      </td>
    </tr>
  )

  return (
    <div className="surface-panel overflow-hidden">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[680px] border-collapse text-left">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="border-b border-stone-200 bg-stone-100/80">
              {safeColumns.map((col) => (
                <th
                  key={col.header}
                  className="whitespace-nowrap px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-stone-700"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-200">
            {isLoading
              ? renderLoading('px-6 py-14 text-center')
              : safeData.length === 0
                ? renderEmpty('px-6 py-16 text-center')
                : safeData.map((row, rowIndex) => (
                    <tr key={getRowKey(row, rowIndex)} className="transition-colors hover:bg-stone-50">
                      {safeColumns.map((col) => (
                        <td key={`${col.header}-${rowIndex}`} className="px-5 py-3.5 text-sm text-stone-800">
                          {getCellValue(row, col)}
                        </td>
                      ))}
                    </tr>
                  ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-3 md:hidden">
        {isLoading ? (
          <div className="rounded-xl border border-stone-200 bg-white px-4 py-8 text-center">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600">
              <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-amber-200 border-t-amber-700" />
              Cargando datos...
            </div>
          </div>
        ) : safeData.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white px-4 py-8 text-center">
            <p className="m-0 text-sm font-semibold text-stone-800">{emptyMessage}</p>
            <p className="m-0 mt-1 text-xs text-stone-500">No hay información para este filtro.</p>
          </div>
        ) : (
          safeData.map((row, rowIndex) => (
            <article key={getRowKey(row, rowIndex)} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <dl className="m-0 space-y-2">
                {safeColumns.map((col) => (
                  <div key={`${col.header}-${rowIndex}`} className="flex items-start justify-between gap-3">
                    <dt className="shrink-0 text-xs font-bold uppercase tracking-wide text-stone-500">{col.header}</dt>
                    <dd className="m-0 max-w-[60%] text-right text-sm font-medium text-stone-800">{getCellValue(row, col)}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))
        )}
      </div>
    </div>
  )
}

export default DataTable
