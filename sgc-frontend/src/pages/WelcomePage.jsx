import { Link } from 'react-router-dom'
import { APP_ROUTES } from '@app/routes'
import backgroundImage from '../assets/condominio.jpg' 

const WelcomePage = () => {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans text-stone-900">
      
      <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600 text-white rounded-lg flex items-center justify-center font-black text-xl shadow-md">
              SGC
            </div>
            <span className="font-bold text-xl tracking-wide text-stone-800 hidden sm:block">
              Sistema de Gestión
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to={APP_ROUTES.login} 
              className="text-stone-600 hover:text-amber-600 font-semibold px-4 py-2 transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link 
              to={APP_ROUTES.register} 
              className="bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 rounded-lg font-bold shadow-md hover:shadow-lg transition-all"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 mt-20">
        <section className="relative w-full h-[600px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img src={backgroundImage} alt="Condominio" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-900/90 via-stone-900/70 to-transparent" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-2xl">
              <span className="inline-block py-1 px-3 rounded-full bg-amber-500/20 text-amber-300 font-bold text-sm tracking-wider mb-4 border border-amber-500/30">
                PLATAFORMA INTEGRAL
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
                Gestión Inteligente para tu <span className="text-amber-500">Comunidad</span>
              </h1>
              <p className="text-lg sm:text-xl text-stone-300 mb-10 leading-relaxed">
                Transparencia financiera, reserva de espacios comunes y comunicación directa con conserjería. Todo desde la palma de tu mano.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to={APP_ROUTES.login} 
                  className="bg-amber-600 hover:bg-amber-500 text-white text-center px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-amber-600/30 transition-all hover:-translate-y-1"
                >
                  Acceder a mi portal
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-black text-stone-900 mb-4">Todo lo que necesitas en un solo lugar</h2>
              <p className="text-stone-500 max-w-2xl mx-auto text-lg">Moderniza la administración de tu edificio o condominio con herramientas diseñadas para facilitar la convivencia.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-stone-50 p-8 rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-lg transition-all group">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-stone-800 mb-3">Finanzas Claras</h3>
                <p className="text-stone-600 leading-relaxed">Paga tus gastos comunes en línea, revisa tu historial de transacciones y accede a los comprobantes de forma inmediata.</p>
              </div>

              <div className="bg-stone-50 p-8 rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-lg transition-all group">
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-stone-800 mb-3">Reserva de Espacios</h3>
                <p className="text-stone-600 leading-relaxed">Agenda el quincho, la piscina o la multi-cancha con un par de clics. Sujeto a validación automática de deudas.</p>
              </div>

              <div className="bg-stone-50 p-8 rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-lg transition-all group">
                <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-stone-800 mb-3">Seguridad y Control</h3>
                <p className="text-stone-600 leading-relaxed">Conserjería digitalizada para un mejor registro de visitas, control de medidores y gestión de paquetería.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-stone-950 text-stone-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-amber-600 text-white rounded flex items-center justify-center font-bold text-sm">SGC</div>
              <span className="font-bold text-lg text-white">Sistema de Gestión</span>
            </div>
            <p className="text-sm">Modernizando la vida en comunidad mediante tecnología accesible y transparente.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to={APP_ROUTES.login} className="hover:text-amber-500 transition-colors">Iniciar Sesión</Link></li>
              <li><Link to={APP_ROUTES.register} className="hover:text-amber-500 transition-colors">Crear Cuenta</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Proyecto</h4>
            <ul className="space-y-2 text-sm">
              <li>Portafolio de Título</li>
              <li>Analista Programador · Duoc UC</li>
              <li>
                <a
                  href="https://github.com/gschwember/Portafolio-titulo"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-amber-500 transition-colors"
                >
                  Ver código fuente
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-stone-800 text-sm text-center">
          &copy; {new Date().getFullYear()} SGC. Proyecto de Título. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  )
}

export default WelcomePage
