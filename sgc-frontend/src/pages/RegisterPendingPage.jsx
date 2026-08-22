import { Link } from 'react-router-dom'
import AuthLayout from '@features/auth/components/AuthLayout'
import { APP_ROUTES } from '@app/routes'

const RegisterPendingPage = () => {
  return (
    <AuthLayout
      title="Cuenta en revision"
      subtitle="Tu cuenta esta en revision y debe ser aprobada"
      footer={
        <>
          Ya tienes credenciales activas?{' '}
          <Link to={APP_ROUTES.login} className="text-amber-700 font-semibold hover:underline">
            Ir a iniciar sesión
          </Link>
        </>
      }
    >
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
        Tu cuenta esta en revision y debe ser aprobada por administracion.
      </div>
    </AuthLayout>
  )
}

export default RegisterPendingPage
