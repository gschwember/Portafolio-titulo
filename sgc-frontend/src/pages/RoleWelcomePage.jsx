import useAuth from '@features/auth/hooks/useAuth'

const RoleWelcomePage = ({ title, subtitle }) => {
  const { logout, user } = useAuth()
  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email || 'Usuario'

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 via-stone-50 to-amber-50 flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-white border border-stone-200 rounded-2xl shadow-lg p-10 text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-amber-700 font-semibold mb-3">Portal SGC</p>
        <h1 className="text-3xl font-extrabold text-stone-900">Bienvenido {fullName}</h1>
        <p className="text-lg text-stone-700 mt-3">{title}</p>
        <p className="text-sm text-stone-500 mt-2">{subtitle}</p>

        <button
          type="button"
          onClick={logout}
          className="mt-8 bg-stone-900 text-stone-50 px-5 py-2.5 rounded-lg font-semibold hover:bg-stone-800 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export default RoleWelcomePage
