import { useId, useState } from 'react'

const FormInput = ({
  id,
  name,
  label,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error = '',
  disabled = false,
  required = false,
  autoComplete,
  minLength,
}) => {
  const generatedId = useId()
  const safeLabel = label?.replace(/\s+/g, '-').toLowerCase()
  const safeId = id || `input-${safeLabel || generatedId}`

  const [showPassword, setShowPassword] = useState(false)
  const isPasswordType = type === 'password'
  const currentType = isPasswordType && showPassword ? 'text' : type

  return (
    <div className="mb-4 flex w-full flex-col">
      {label && (
        <label htmlFor={safeId} className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-stone-700">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative w-full">
        <input
          id={safeId}
          name={name}
          type={currentType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          minLength={minLength}
          aria-invalid={Boolean(error)}
          className={`input-base ${isPasswordType ? 'pr-11' : ''} ${error ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500/30' : ''}`}
        />

        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword((previous) => !previous)}
            disabled={disabled}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400 transition-colors hover:text-stone-700"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M3 3l18 18m-9.2-4.2A4.8 4.8 0 017.2 12m9.6 0c-.5 1.7-2 3.2-3.8 3.8m-7.6-3.8c1.4-3.5 4.6-5.8 8.6-5.8 1.9 0 3.6.5 5.1 1.5M2.8 12c.7 1.9 2 3.4 3.6 4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M2.5 12c1.6-3.8 5.3-6.2 9.5-6.2s7.9 2.4 9.5 6.2c-1.6 3.8-5.3 6.2-9.5 6.2S4.1 15.8 2.5 12zm9.5 3.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                />
              </svg>
            )}
          </button>
        )}
      </div>

      {error && (
        <span className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
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

export default FormInput
