import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const COOLDOWN_SEG = 60

export default function ConfirmarPendiente() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const email = state?.email ?? ''
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (!email) navigate('/login', { replace: true })
  }, [email, navigate])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function reenviar() {
    setResending(true)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setResending(false)

    if (error) {
      toast.error(`Error al reenviar: ${error.message}`)
    } else {
      setCooldown(COOLDOWN_SEG)
      toast.success('Email reenviado — revisá tu bandeja y carpeta de spam')
    }
  }

  if (!email) return null

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">

        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-ink mb-3">Revisá tu email</h1>

        <p className="text-ink/60 text-sm mb-1">Te enviamos un mensaje a</p>
        <p className="font-semibold text-ink text-base mb-4">{email}</p>

        <p className="text-ink/60 text-sm mb-8 leading-relaxed">
          Hacé clic en el link que te enviamos para confirmar tu cuenta y acceder a AcompañarTe.
        </p>

        <div className="card text-left text-sm mb-6 space-y-2">
          <p className="font-medium text-ink">¿No te llegó?</p>
          <p className="text-ink/60">· Revisá la carpeta de spam o correo no deseado.</p>
          <p className="text-ink/60">· El email puede demorar unos minutos.</p>
          <p className="text-ink/60">· Verificá que el email esté bien escrito.</p>
        </div>

        <button
          onClick={reenviar}
          disabled={resending || cooldown > 0}
          className="btn-secondary w-full mb-4 disabled:opacity-50"
        >
          {resending
            ? 'Reenviando...'
            : cooldown > 0
              ? `Podés reenviar en ${cooldown}s`
              : 'Reenviar email de confirmación'}
        </button>

        <button
          onClick={() => navigate('/login')}
          className="text-sm text-ink/50 hover:text-ink transition-colors"
        >
          Volver al inicio de sesión
        </button>
      </div>
    </div>
  )
}
