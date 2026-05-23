import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext } from './auth-store'

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (user) => {
    try {
      const { data, error } = await supabase
        .from('at_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.warn('[AuthContext] fetchProfile query:', error.message)
      }

      if (data) {
        setProfile(data)
        return
      }

      // Perfil no está en DB (RLS bloqueó el insert en signup con email confirmation).
      // Usamos user_metadata como fuente de verdad — siempre disponible.
      const meta = user.user_metadata ?? {}
      const fallback = {
        id:          user.id,
        email:       user.email,
        nombre:      meta.nombre   ?? '',
        apellido:    meta.apellido ?? '',
        rol:         meta.rol      ?? 'paciente',
        avatar_url:  null,
        obra_social: null,
      }
      setProfile(fallback)

      // Intentar persistir en background (puede fallar por RLS — no bloqueante)
      supabase.from('at_profiles').insert(fallback).then(({ error: insertErr }) => {
        if (insertErr && !insertErr.message.includes('duplicate')) {
          console.warn('[AuthContext] background insert perfil:', insertErr.message)
        }
      })
    } catch (e) {
      console.warn('[AuthContext] fetchProfile', e)
      const meta = user.user_metadata ?? {}
      setProfile({
        id:          user.id,
        email:       user.email,
        nombre:      meta.nombre   ?? '',
        apellido:    meta.apellido ?? '',
        rol:         meta.rol      ?? 'paciente',
        avatar_url:  null,
        obra_social: null,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    supabase.auth
      .getSession()
      .then((result) => {
        const session = result?.data?.session ?? null
        if (session?.user) {
          setUser(session.user)
          void fetchProfile(session.user)
        } else {
          setLoading(false)
        }
      })
      .catch((err) => {
        console.warn('[AuthContext] getSession', err)
        setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        setLoading(true)
        void fetchProfile(session.user)
      } else {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  async function signUp({ email, password, nombre, apellido, rol, atData }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre, apellido, rol },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
    if (!data.user) throw new Error('No se pudo crear el usuario.')

    const { error: profileError } = await supabase.from('at_profiles').insert({
      id: data.user.id, email, nombre, apellido, rol,
    })
    if (profileError && !profileError.message.includes('duplicate')) {
      if (data.session) throw profileError
      console.warn('Profile insert sin sesión:', profileError.message)
    }

    if (rol === 'at' && atData && data.session) {
      await supabase.from('perfiles_at').insert({
        profile_id:     data.user.id,
        zona:           atData.zona           || null,
        obras_sociales: atData.obras_sociales ?? [],
        especialidades: atData.especialidades ?? [],
        honorarios:     atData.honorarios ? Number(atData.honorarios) : null,
        activo:         true,
      })
    }

    return data
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
