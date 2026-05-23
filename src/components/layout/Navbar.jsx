import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    toast.success('Sesión cerrada')
    navigate('/')
  }

  const isAT = profile?.rol === 'at'
  const homePath = isAT ? '/panel-at' : '/panel-paciente'

  return (
    <nav className="bg-white/90 backdrop-blur-sm border-b border-primary-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          to={user ? homePath : '/'}
          className="font-display text-xl font-bold text-primary-700 tracking-tight"
        >
          AcompañarTe
        </Link>

        <div className="flex items-center gap-5">
          {user ? (
            <>
              {isAT ? (
                <>
                  <Link to="/panel-at" className="text-sm text-ink/70 hover:text-primary-600 font-medium transition-colors">
                    Inicio
                  </Link>
                  <Link to="/busquedas" className="text-sm text-ink/70 hover:text-primary-600 font-medium transition-colors">
                    Búsquedas
                  </Link>
                  <Link to="/atelier" className="text-sm text-ink/70 hover:text-primary-600 font-medium transition-colors">
                    ATelier
                  </Link>
                  <Link to="/dashboard/at" className="text-sm text-ink/70 hover:text-primary-600 font-medium transition-colors">
                    Mi perfil
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/panel-paciente" className="text-sm text-ink/70 hover:text-primary-600 font-medium transition-colors">
                    Buscar AT
                  </Link>
                  <Link to="/busquedas" className="text-sm text-ink/70 hover:text-primary-600 font-medium transition-colors">
                    Búsquedas activas
                  </Link>
                  <Link to="/atelier" className="text-sm text-ink/70 hover:text-primary-600 font-medium transition-colors">
                    ATelier
                  </Link>
                  <Link to="/dashboard/paciente" className="text-sm text-ink/70 hover:text-primary-600 font-medium transition-colors">
                    Mi cuenta
                  </Link>
                </>
              )}
              <button onClick={handleSignOut} className="btn-secondary text-sm py-1.5">
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/buscar" className="text-sm text-ink/70 hover:text-primary-600 font-medium transition-colors">
                Buscar AT
              </Link>
              <Link to="/atelier" className="text-sm text-ink/70 hover:text-primary-600 font-medium transition-colors">
                ATelier
              </Link>
              <Link to="/login" className="btn-secondary text-sm py-1.5">
                Ingresar
              </Link>
              <Link to="/onboarding" className="btn-primary text-sm py-1.5">
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
