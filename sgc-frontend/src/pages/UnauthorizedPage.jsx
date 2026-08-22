import { Link } from 'react-router-dom'
import { APP_ROUTES } from '@app/routes'

const UnauthorizedPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <div className="surface-panel w-full max-w-md p-8 text-center animate-fade-in-up">
        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-700">
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M12 9v3.75m0 3h.008m8.242-3.75a8.25 8.25 0 11-16.5 0 8.25 8.25 0 0116.5 0z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
            />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-stone-900">Acceso no autorizado</h1>
        <p className="mt-3 text-stone-600">Tu perfil no tiene permisos para acceder a este módulo.</p>
        <Link to={APP_ROUTES.home} className="btn-primary mt-6 w-full">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}

export default UnauthorizedPage
