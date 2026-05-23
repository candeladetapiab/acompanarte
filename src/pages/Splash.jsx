import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const fadeUp = { animation: 'fadeUp 0.6s ease both' }
const delays = {
  logo:    { ...fadeUp, animationDelay: '0ms' },
  titulo:  { ...fadeUp, animationDelay: '150ms' },
  tagline: { ...fadeUp, animationDelay: '300ms' },
  botones: { ...fadeUp, animationDelay: '450ms' },
}

export default function Splash() {
  const { user, profile, loading } = useAuth()

  console.log('[Splash]', { loading, userId: user?.id, rol: profile?.rol })

  // Esperar a que termine de cargar sesión y perfil
  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
    </div>
  )

  // Usuario logueado → panel según rol
  if (user && profile) {
    return <Navigate to={profile.rol === 'at' ? '/panel-at' : '/panel-paciente'} replace />
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="min-h-screen bg-cream flex flex-col px-6">
        <div className="flex-1 flex flex-col items-center justify-center">

          <div
            style={delays.logo}
            className="w-24 h-24 bg-gradient-to-br from-primary-600 to-accent-400 rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-primary-200"
          >
            <span className="text-4xl">🤝</span>
          </div>

          <h1 style={delays.titulo} className="text-4xl font-bold text-ink mb-3 text-center">
            AcompañarTe
          </h1>

          <p style={delays.tagline} className="text-ink/55 text-center text-base leading-relaxed max-w-xs">
            Conectamos acompañantes terapéuticos con quienes los necesitan
          </p>

        </div>

        <div style={delays.botones} className="pb-12 space-y-3 w-full max-w-sm mx-auto">
          <Link to="/onboarding" className="btn-primary w-full py-3.5 text-base text-center block">
            Comenzar
          </Link>
          <Link to="/login" className="btn-secondary w-full py-3.5 text-base text-center block">
            Ya tengo cuenta
          </Link>
        </div>
      </div>
    </>
  )
}
