import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import Navbar from './components/layout/Navbar'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'
import Login from './pages/Login'
import RegisterAT from './pages/RegisterAT'
import RegisterPaciente from './pages/RegisterPaciente'
import ConfirmarPendiente from './pages/ConfirmarPendiente'
import AuthCallback from './pages/AuthCallback'
import HomePaciente from './pages/HomePaciente'
import HomeAT from './pages/HomeAT'
import BuscarAT from './pages/BuscarAT'
import PerfilPublicoAT from './pages/PerfilPublicoAT'
import DashboardAT from './pages/DashboardAT'
import DashboardPaciente from './pages/DashboardPaciente'
import PublicarBusqueda from './pages/PublicarBusqueda'
import BusquedasActivas from './pages/BusquedasActivas'
import Mensajes from './pages/Mensajes'
import ChatConversacion from './pages/ChatConversacion'
import NotificadorMensajes from './components/NotificadorMensajes'
import AdminPanel from './pages/AdminPanel'
import ATelier from './pages/ATelier'

const ROUTES_SIN_NAVBAR = [
  '/', '/onboarding', '/login',
  '/registro/at', '/registro/paciente',
  '/confirmar-pendiente', '/auth/callback',
]

function ProtectedRoute({ children, rolRequerido }) {
  const { user, profile, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  )
  if (!user) return <Navigate to="/" replace />
  if (rolRequerido && profile?.rol !== rolRequerido) return <Navigate to="/" replace />
  return children
}

function RootPage() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center" aria-busy="true">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }
  if (user && profile) {
    return <Navigate to={profile.rol === 'at' ? '/panel-at' : '/panel-paciente'} replace />
  }
  return <Home />
}

function AppRoutes() {
  const location = useLocation()
  const hiddenNavbar = ROUTES_SIN_NAVBAR.includes(location.pathname) ||
    location.pathname.startsWith('/mensajes/')
  const showNavbar = !hiddenNavbar

  return (
    <div className="min-h-screen bg-cream">
      {showNavbar && <Navbar />}
      <NotificadorMensajes />
      <Routes>
        {/* Públicas */}
        <Route path="/"                    element={<RootPage />} />
        <Route path="/onboarding"          element={<Onboarding />} />
        <Route path="/login"               element={<Login />} />
        <Route path="/registro/at"         element={<RegisterAT />} />
        <Route path="/registro/paciente"   element={<RegisterPaciente />} />
        <Route path="/confirmar-pendiente" element={<ConfirmarPendiente />} />
        <Route path="/auth/callback"       element={<AuthCallback />} />
        <Route path="/buscar"              element={<BuscarAT />} />
        <Route path="/at/:id"              element={<PerfilPublicoAT />} />
        <Route path="/busquedas"           element={<BusquedasActivas />} />
        <Route path="/atelier"             element={<ATelier />} />

        {/* Panel AT */}
        <Route path="/panel-at"
          element={<ProtectedRoute rolRequerido="at"><HomeAT /></ProtectedRoute>}
        />
        <Route path="/dashboard/at"
          element={<ProtectedRoute rolRequerido="at"><DashboardAT /></ProtectedRoute>}
        />

        {/* Panel Paciente */}
        <Route path="/panel-paciente"
          element={<ProtectedRoute rolRequerido="paciente"><HomePaciente /></ProtectedRoute>}
        />
        <Route path="/dashboard/paciente"
          element={<ProtectedRoute rolRequerido="paciente"><DashboardPaciente /></ProtectedRoute>}
        />
        <Route path="/publicar-busqueda"
          element={<ProtectedRoute rolRequerido="paciente"><PublicarBusqueda /></ProtectedRoute>}
        />

        {/* Mensajes y Chat */}
        <Route path="/mensajes"
          element={<ProtectedRoute><Mensajes /></ProtectedRoute>}
        />
        <Route path="/mensajes/:userId"
          element={<ProtectedRoute><ChatConversacion /></ProtectedRoute>}
        />

        {/* Redirects */}
        <Route path="/home/at"       element={<Navigate to="/panel-at" replace />} />
        <Route path="/home/paciente" element={<Navigate to="/panel-paciente" replace />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/registro"      element={<Navigate to="/onboarding" replace />} />
        <Route path="*"              element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
