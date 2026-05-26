import { Routes, Route, Navigate } from 'react-router-dom'
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
import ATelier from './pages/ATelier'
import DashboardAT from './pages/DashboardAT'
import DashboardPaciente from './pages/DashboardPaciente'
import PublicarBusqueda from './pages/PublicarBusqueda'
import BusquedasActivas from './pages/BusquedasActivas'
import PerfilPublicoAT from './pages/PerfilAT'
import AdminPanel from './pages/AdminPanel'
import ChatConversacion from './pages/ChatConversacion'
import NotificadorMensajes from './components/NotificadorMensajes'

function ProtectedRoute({ children, rolRequerido }) {
  const { user, profile, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (rolRequerido && profile?.rol !== rolRequerido) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <div>
      <Navbar />
      <NotificadorMensajes />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro/at" element={<RegisterAT />} />
        <Route path="/registro/paciente" element={<RegisterPaciente />} />
        <Route path="/confirmar-pendiente" element={<ConfirmarPendiente />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/at/:id" element={<PerfilPublicoAT />} />
        <Route path="/busquedas" element={<BusquedasActivas />} />
        <Route path="/atelier" element={<ATelier />} />
        <Route path="/dashboard/at" element={<ProtectedRoute rolRequerido="at"><DashboardAT /></ProtectedRoute>} />
        <Route path="/dashboard/paciente" element={<ProtectedRoute rolRequerido="paciente"><DashboardPaciente /></ProtectedRoute>} />
        <Route path="/publicar-busqueda" element={<ProtectedRoute rolRequerido="paciente"><PublicarBusqueda /></ProtectedRoute>} />
        <Route path="/mensajes/:otroId" element={<ProtectedRoute><ChatConversacion /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/panel-at" element={<Navigate to="/dashboard/at" replace />} />
        <Route path="/panel-paciente" element={<Navigate to="/dashboard/paciente" replace />} />
        <Route path="/home/at" element={<Navigate to="/dashboard/at" replace />} />
        <Route path="/home/paciente" element={<Navigate to="/dashboard/paciente" replace />} />
        <Route path="/registro" element={<Navigate to="/onboarding" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
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
