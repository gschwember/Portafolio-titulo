import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import AuthLayout from '@features/auth/components/AuthLayout'
import useAuth from '@features/auth/hooks/useAuth'
import FormInput from '@shared/ui/FormInput'
import { APP_ROUTES } from '@app/routes'
import { PASSWORD_MIN_LENGTH } from '@features/auth/model/auth.constants'

const RegisterPage = () => {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [formData, setFormData] = useState({
    rut: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (key) => (event) => {
    setFormData((previous) => ({ ...previous, [key]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (formData.password !== formData.passwordConfirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setIsSubmitting(true)

    try {
      await register(formData)
      navigate(APP_ROUTES.registerPending, { replace: true })
    } catch (submitError) {
      setError(submitError.message || 'No fue posible registrar la cuenta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle="Registra tu acceso al portal SGC"
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to={APP_ROUTES.login} className="text-amber-700 font-semibold hover:underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="animate-fade-in">
        <FormInput
          label="RUT"
          value={formData.rut}
          onChange={handleChange('rut')}
          placeholder="12.345.678-9"
          required
        />
        <FormInput
          label="Nombre"
          value={formData.firstName}
          onChange={handleChange('firstName')}
          placeholder="Juan"
          required
        />
        <FormInput
          label="Apellido"
          value={formData.lastName}
          onChange={handleChange('lastName')}
          placeholder="Perez"
          required
        />
        <FormInput
          label="Correo electrónico"
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          placeholder="usuario@correo.com"
          autoComplete="email"
          required
        />

        <FormInput
          label="Contraseña"
          type="password"
          value={formData.password}
          onChange={handleChange('password')}
          placeholder="Mínimo 12 caracteres, con letra y número"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          required
        />
        <FormInput
          label="Confirmar contraseña"
          type="password"
          value={formData.passwordConfirmation}
          onChange={handleChange('passwordConfirmation')}
          placeholder="Repite tu contraseña"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          required
        />

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full bg-amber-700 text-amber-50 hover:bg-amber-800"
        >
          {isSubmitting ? 'Registrando...' : 'Crear cuenta'}
        </button>
      </form>
    </AuthLayout>
  )
}

export default RegisterPage
