import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import toast from 'react-hot-toast'

export default function ChatConversacion() {
  const { userId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mensajes, setMensajes] = useState([])
  const [otroUsuario, setOtroUsuario] = useState(null)
  const [loading, setLoading] = useState(true)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!user || !userId) return
    fetchDatos()

    // Marcar mensajes de esta conversación como leídos
    supabase
      .from('messages')
      .update({ leido: true })
      .eq('receiver_id', user.id)
      .eq('sender_id', userId)
      .eq('leido', false)
      .then(() => {})

    // Suscripción en tiempo real
    const channel = supabase
      .channel(`chat-${user.id}-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, payload => {
        if (payload.new.sender_id === userId) {
          setMensajes(prev => [...prev, payload.new])
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user, userId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  async function fetchDatos() {
    setLoading(true)

    const [{ data: msgs }, { data: perfil }] = await Promise.all([
      supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true }),
      supabase
        .from('at_profiles')
        .select('id, nombre, apellido, foto_url')
        .eq('id', userId)
        .maybeSingle(),
    ])

    setMensajes(msgs ?? [])
    setOtroUsuario(perfil)
    setLoading(false)
  }

  async function enviar(e) {
    e.preventDefault()
    if (!texto.trim() || enviando) return
    setEnviando(true)

    const nuevoMensaje = {
      sender_id: user.id,
      receiver_id: userId,
      content: texto.trim(),
    }

    const { data, error } = await supabase
      .from('messages')
      .insert(nuevoMensaje)
      .select()
      .single()

    if (error) {
      toast.error('No se pudo enviar el mensaje')
      setEnviando(false)
      return
    }

    setMensajes(prev => [...prev, data])
    setTexto('')
    setEnviando(false)
    inputRef.current?.focus()
  }

  const nombreOtro = otroUsuario
    ? `${otroUsuario.nombre ?? ''} ${otroUsuario.apellido ?? ''}`.trim()
    : 'Usuario'

  function formatHora(fecha) {
    return new Date(fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  function formatFecha(fecha) {
    const hoy = new Date()
    const d = new Date(fecha)
    if (d.toDateString() === hoy.toDateString()) return 'Hoy'
    const ayer = new Date(hoy)
    ayer.setDate(hoy.getDate() - 1)
    if (d.toDateString() === ayer.toDateString()) return 'Ayer'
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
  }

  // Agrupar mensajes por fecha
  const mensajesAgrupados = []
  let fechaActual = null
  mensajes.forEach(m => {
    const fecha = formatFecha(m.created_at)
    if (fecha !== fechaActual) {
      mensajesAgrupados.push({ tipo: 'fecha', fecha })
      fechaActual = fecha
    }
    mensajesAgrupados.push({ tipo: 'mensaje', ...m })
  })

  return (
    <div className="flex flex-col h-screen bg-[#F5F0FA]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2D1F45] to-[#7C5C9E] px-4 pt-10 pb-4 flex-shrink-0">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/mensajes')}
            className="text-white/60 hover:text-white transition-colors mr-1"
          >
            ←
          </button>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
            {otroUsuario?.foto_url
              ? <img src={otroUsuario.foto_url} alt="" className="w-full h-full object-cover" />
              : (nombreOtro?.[0] ?? '?').toUpperCase()}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{nombreOtro}</p>
            <p className="text-white/40 text-xs">Conversación</p>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-1">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary-500" />
            </div>
          ) : mensajesAgrupados.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-ink/40 text-sm">No hay mensajes todavía. ¡Enviá el primero!</p>
            </div>
          ) : (
            mensajesAgrupados.map((item, i) => {
              if (item.tipo === 'fecha') {
                return (
                  <div key={`fecha-${i}`} className="flex justify-center my-4">
                    <span className="bg-white border border-gray-100 text-ink/40 text-xs px-3 py-1 rounded-full shadow-sm">
                      {item.fecha}
                    </span>
                  </div>
                )
              }

              const esMio = item.sender_id === user.id
              return (
                <div key={item.id} className={`flex ${esMio ? 'justify-end' : 'justify-start'} mb-1`}>
                  <div className={`max-w-[75%] ${esMio ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      esMio
                        ? 'bg-[#7C5C9E] text-white rounded-br-sm'
                        : 'bg-white border border-gray-100 text-ink rounded-bl-sm shadow-sm'
                    }`}>
                      {item.content}
                    </div>
                    <span className="text-xs text-ink/30 mt-1 mx-1">
                      {formatHora(item.created_at)}
                    </span>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={enviar} className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  enviar(e)
                }
              }}
              rows={1}
              placeholder="Escribí un mensaje..."
              className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-ink placeholder:text-ink/35 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300 transition-all resize-none"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <button
              type="submit"
              disabled={enviando || !texto.trim()}
              className="w-11 h-11 bg-[#7C5C9E] hover:bg-[#6a4e8a] disabled:opacity-40 text-white rounded-2xl flex items-center justify-center transition-colors flex-shrink-0"
            >
              {enviando ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
