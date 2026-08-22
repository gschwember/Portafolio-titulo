import { useRef, useState } from 'react'

const FileUploader = ({
  label = 'Subir comprobante',
  accept = '.pdf, image/jpeg, image/png',
  maxSizeMB = 5,
  onFileSelect,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const validateAndProcessFile = (file) => {
    setError('')

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`El archivo supera el maximo permitido de ${maxSizeMB}MB.`)
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
    onFileSelect?.(file)
  }

  const removeFile = (event) => {
    event.stopPropagation()
    setSelectedFile(null)
    setError('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    onFileSelect?.(null)
  }

  const isActiveDrop = isDragging && !disabled
  const canOpenPicker = !disabled

  return (
    <div className="mb-4 flex w-full flex-col">
      {label && <span className="mb-2 text-sm font-semibold text-stone-700">{label}</span>}

      <button
        type="button"
        disabled={disabled}
        onClick={() => canOpenPicker && fileInputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setIsDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          if (disabled) return
          const [file] = event.dataTransfer.files
          if (file) validateAndProcessFile(file)
        }}
        className={`relative flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-6 text-center transition-all duration-200 ${
          disabled
            ? 'cursor-not-allowed border-stone-300 bg-stone-100 opacity-70'
            : isActiveDrop
              ? 'border-amber-600 bg-amber-50'
              : selectedFile
                ? 'border-emerald-400 bg-emerald-50/70'
                : 'border-stone-300 bg-stone-50 hover:border-amber-500 hover:bg-stone-100'
        } ${error ? 'border-red-400 bg-red-50' : ''}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(event) => {
            const [file] = event.target.files
            if (file) validateAndProcessFile(file)
          }}
          accept={accept}
          disabled={disabled}
          className="hidden"
        />

        {selectedFile ? (
          <div className="flex flex-col items-center">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
              </svg>
            </div>
            <p className="m-0 max-w-[240px] truncate text-sm font-bold text-stone-900" title={selectedFile.name}>
              {selectedFile.name}
            </p>
            <p className="m-0 mt-1 text-xs text-stone-600">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            {!disabled && (
              <button
                type="button"
                onClick={removeFile}
                className="mt-3 rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
              >
                Quitar archivo
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <svg className={`mb-3 h-10 w-10 ${isActiveDrop ? 'text-amber-700' : 'text-stone-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M7 16a4 4 0 01-.9-7.9A5 5 0 1116 6a4 4 0 011 8M12 12v8m0-8l-3 3m3-3l3 3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.7}
              />
            </svg>
            <p className="m-0 text-sm font-medium text-stone-900">
              <span className="font-bold text-amber-700">Haz clic para seleccionar</span> o arrastra el archivo aqui
            </p>
            <p className="m-0 mt-1 text-xs text-stone-600">PDF, JPG o PNG (maximo {maxSizeMB}MB)</p>
          </div>
        )}
      </button>

      {error && (
        <span className="mt-2 flex items-center gap-1 text-xs font-medium text-red-600">
          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M12 8.5v4m0 3h.01m8-3.5A8 8 0 114 12a8 8 0 0116 0z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
          {error}
        </span>
      )}
    </div>
  )
}

export default FileUploader
