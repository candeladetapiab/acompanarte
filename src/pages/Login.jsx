import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

function panelSegunRol(user, profile) {
  const rol = profile?.rol ?? user?.user_metadata?.rol ?? 'paciente'
  return rol === 'at' ? '/panel-at' : '/panel-paciente'
}

export default function Login() {
  const { user, profile, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()
  const [emailSinConfirmar, setEmailSinConfirmar] = useState(false)
  const [reenviando, setReenviando] = useState(false)

  // Si ya hay sesión activa, redirigir al panel correspondiente
  useEffect(() => {
    if (!loading && user) {
      navigate(panelSegunRol(user, profile), { replace: true })
    }
  }, [loading, user, profile, navigate])

  // Mientras verifica la sesión, mostrar spinner
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  )

  async function onSubmit(data) {
    setEmailSinConfirmar(false)
    try {
      const result = await signIn(data)
      navigate(panelSegunRol(result.user, null), { replace: true })
    } catch (err) {
      if (err.message === 'Email not confirmed') {
        setEmailSinConfirmar(true)
      } else {
        const msg = err.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos'
          : err.message
        toast.error(msg)
      }
    }
  }

  async function reenviarConfirmacion() {
    const email = watch('email')
    if (!email) { toast.error('Ingresá tu email primero'); return }
    setReenviando(true)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setReenviando(false)
    if (error) toast.error(error.message)
    else toast.success('Email de confirmación reenviado')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cream">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-600 to-accent-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🤝</span>
          </div>
          <h1 className="text-2xl font-bold text-ink">Bienvenido/a de vuelta</h1>
          <p className="text-ink/50 text-sm mt-1">Ingresá a tu cuenta de AcompañarTe</p>
        </div>

        {emailSinConfirmar && (
          <div className="bg-secondary-100 border border-secondary-400/30 rounded-xl p-4 mb-4 text-sm text-ink/80">
            <p className="font-medium text-ink mb-1">Confirmá tu email para ingresar</p>
            <p className="mb-3">Revisá tu casilla de entrada y la carpeta de spam.</p>
            <button
              type="button"
              onClick={reenviarConfirmacion}
              disabled={reenviando}
              className="text-primary-600 font-medium hover:underline"
            >
              {reenviando ? 'Reenviando...' : 'Reenviar email de confirmación'}
            </button>
          </div>
        )}

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="tu@email.com"
                autoComplete="email"
                {...register('email', { required: 'El email es obligatorio' })}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Contraseña</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password', { required: 'La contraseña es obligatoria' })}
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3 text-base text-center mt-2"
            >
              {isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-gray-100 text-center">
            <p className="text-sm text-ink/50">
              ¿No tenés cuenta?{' '}
              <Link to="/onboarding" className="text-primary-600 font-medium hover:underline">
                Registrate
              </Link>
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
            <div className="text-lg mb-1">💜</div>
            <div className="text-xs font-medium text-ink">Soy AT</div>
            <div className="text-xs text-ink/45">Panel profesional</div>
          </div>
          <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
            <div className="text-lg mb-1">🧡</div>
            <div className="text-xs font-medium text-ink">Soy paciente</div>
            <div className="text-xs text-ink/45">Buscar mi AT</div>
          </div>
        </div>
      </div>
    </div>
  )
}
