import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function AuthCallback() {
  const navigate = useNavigate()
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true

    async function handleCallback() {
      try {
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        console.log('[AuthCallback] code en URL:', code ? 'sí' : 'no')

        let session = null

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          console.log('[AuthCallback] exchangeCodeForSession →', { user: data?.session?.user?.id, error })
          if (error) throw error
          session = data.session
        } else {
          const { data } = await supabase.auth.getSession()
          session = data.session
          console.log('[AuthCallback] getSession →', { user: session?.user?.id })
        }

        if (!session?.user) throw new Error('No se pudo verificar la sesión.')

        const { user } = session
        const meta = user.user_metadata
        console.log('[AuthCallback] user metadata:', meta)

        // Buscar perfil existente
        const { data: perfil } = await supabase
          .from('at_profiles')
          .select('rol')
          .eq('id', user.id)
          .single()

        console.log('[AuthCallback] perfil en DB:', perfil)

        // Crear perfil si no existe (caso: email confirmation activado + RLS bloqueó el insert en signup)
        if (!perfil) {
          console.log('[AuthCallback] perfil no encontrado, creando...')
          const { error: insertError } = await supabase.from('at_profiles').insert({
            id:       user.id,
            email:    user.email,
            nombre:   meta.nombre   ?? '',
            apellido: meta.apellido ?? '',
            rol:      meta.rol      ?? 'paciente',
          })
          if (insertError) console.warn('[AuthCallback] error creando perfil:', insertError.message)

          if (meta.rol === 'at') {
            const { error: atError } = await supabase.from('perfiles_at').insert({
              profile_id:     user.id,
              activo:         true,
              obras_sociales: [],
              especialidades: [],
            })
            if (atError) console.warn('[AuthCallback] error creando perfiles_at:', atError.message)
          }
        }

        const rol = perfil?.rol ?? meta.rol ?? 'paciente'
        const destino = rol === 'at' ? '/home/at' : '/home/paciente'
        console.log('[AuthCallback] redirigiendo a:', destino)
        navigate(destino, { replace: true })
      } catch (err) {
        console.error('[AuthCallback] error:', err)
        toast.error('No se pudo confirmar la cuenta. Intentá ingresar nuevamente.')
        navigate('/login', { replace: true })
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-ink/60 text-sm">Confirmando tu cuenta...</p>
      </div>
    </div>
  )
}
