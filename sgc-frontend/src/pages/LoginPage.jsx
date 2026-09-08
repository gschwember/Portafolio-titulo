import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import AuthLayout from '@features/auth/components/AuthLayout'
import useAuth from '@features/auth/hooks/useAuth'
import { getHomeRouteByRole } from '@features/auth/model/roleRedirect'
import FormInput from '@shared/ui/FormInput'
import { APP_ROUTES } from '@app/routes'

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const from = location.state?.from?.pathname
  const infoMessage = location.state?.message

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const session = await login({ email, password })
      const fallbackRoute = getHomeRouteByRole(session?.user?.role)
      navigate(from || fallbackRoute, { replace: true })
    } catch (submitError) {
      const normalizedMessage = String(submitError?.message || '').toLowerCase()
      if (
        normalizedMessage.includes('inactivo')
        || normalizedMessage.includes('revision')
        || normalizedMessage.includes('aprobada')
      ) {
        navigate(APP_ROUTES.registerPending, { replace: true })
        return
      }
      setError(submitError.message || 'No fue posible iniciar sesión.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Iniciar sesión"
      subtitle="Accede con tu cuenta para administrar tu condominio"
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link to={APP_ROUTES.register} className="text-amber-700 font-semibold hover:underline">
            Regístrate
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="animate-fade-in">
        {infoMessage && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
            {infoMessage}
          </div>
        )}
        <FormInput
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="usuario@correo.com"
          autoComplete="email"
          required
        />
        <FormInput
          label="Contraseña"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Tu contraseña"
          autoComplete="current-password"
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
          className="btn-primary w-full"
        >
          {isSubmitting ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </AuthLayout>
  )
}

export default LoginPage
