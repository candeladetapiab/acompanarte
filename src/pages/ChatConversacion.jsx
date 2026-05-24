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
  const [otroUsuarioExtra, setOtroUsuarioExtra] = useState(null)
  const [loading, setLoading] = useState(true)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mostrarPerfil, setMostrarPerfil] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!user || !userId) return
    fetchDatos()

    // Marcar como leídos
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
          // Marcar como leído inmediatamente
          supabase.from('messages').update({ leido: true }).eq('id', payload.new.id).then(() => {})
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${user.id}`,
      }, payload => {
        setMensajes(prev => prev.map(m => m.id === payload.new.id ? payload.new : m))
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
        .select('*')
        .eq('id', userId)
        .maybeSingle(),
    ])

    setMensajes(msgs ?? [])

    if (perfil) {
      setOtroUsuario(perfil)
    } else {
      // Buscar en profiles (pacientes)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      setOtroUsuario(profileData)
    }

    setLoading(false)
  }

  async function enviar(e) {
    e.preventDefault()
    if (!texto.trim() || enviando) return
    setEnviando(true)

    const { data, error } = await supabase
      .from('messages')
      .insert({ sender_id: user.id, receiver_id: userId, content: texto.trim() })
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
    const d = new Date(fecha)
    const hoy = new Date()
    const ayer = new Date(hoy)
    ayer.setDate(ayer.getDate() - 1)
    if (d.toDateString() === hoy.toDateString()) return 'Hoy'
    if (d.toDateString() === ayer.toDateString()) return 'Ayer'
    return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  // Agrupar mensajes por fecha
  const mensajesAgrupados = []
  let ultimaFecha = null
  mensajes.forEach(m => {
    const fechaStr = formatFecha(m.created_at)
    if (fechaStr !== ultimaFecha) {
      mensajesAgrupados.push({ tipo: 'fecha', fecha: fechaStr })
      ultimaFecha = fechaStr
    }
    mensajesAgrupados.push({ tipo: 'mensaje', ...m })
  })

  // Último mensaje enviado por mí
  const ultimoMioId = [...mensajes].reverse().find(m => m.sender_id === user.id)?.id

  return (
    <div className="flex flex-col h-screen bg-[#F5F0FA]">

      {/* Header */}
      <div className="bg-gradient-to-r from-[#2D1F45] to-[#7C5C9E] px-4 pt-10 pb-4 flex-shrink-0">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/mensajes')}
            className="text-white/60 hover:text-white transition-colors mr-1 text-xl"
          >
            ←
          </button>
          <button
            className="flex items-center gap-3 flex-1 text-left"
            onClick={() => setMostrarPerfil(true)}
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
              {otroUsuario?.foto_url
                ? <img src={otroUsuario.foto_url} alt="" className="w-full h-full object-cover" />
                : (nombreOtro?.[0] ?? '?').toUpperCase()}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{nombreOtro}</p>
              <p className="text-white/40 text-xs">Toca para ver perfil</p>
            </div>
          </button>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-1">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#7C5C9E]" />
            </div>
          ) : mensajesAgrupados.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#2D1F45]/40 text-sm">No hay mensajes todavía. ¡Enviá el primero!</p>
            </div>
          ) : (
            mensajesAgrupados.map((item, i) => {
              if (item.tipo === 'fecha') {
                return (
                  <div key={`fecha-${i}`} className="flex justify-center my-4">
                    <span className="bg-white border border-gray-100 text-[#2D1F45]/40 text-xs px-3 py-1 rounded-full shadow-sm capitalize">
                      {item.fecha}
                    </span>
                  </div>
                )
              }

              const esMio = item.sender_id === user.id
              const esUltimoMio = item.id === ultimoMioId

              return (
                <div key={item.id} className={`flex ${esMio ? 'justify-end' : 'justify-start'} mb-1`}>
                  <div className={`max-w-[75%] ${esMio ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      esMio
                        ? 'bg-[#7C5C9E] text-white rounded-br-sm'
                        : 'bg-white border border-gray-100 text-[#2D1F45] rounded-bl-sm shadow-sm'
                    }`}>
                      {item.content}
                    </div>
                    <div className={`flex items-center gap-1 mt-1 mx-1 ${esMio ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="text-xs text-[#2D1F45]/30">
                        {formatHora(item.created_at)}
                      </span>
                      {esMio && esUltimoMio && (
                        <span className={`text-xs font-medium ${item.leido ? 'text-[#7C5C9E]' : 'text-[#2D1F45]/30'}`}>
                          {item.leido ? '✓✓ Leído' : '✓ Enviado'}
                        </span>
                      )}
                    </div>
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
              className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-[#2D1F45] placeholder:text-[#2D1F45]/35 focus:outline-none focus:ring-2 focus:ring-[#C9A8E8]/40 transition-all resize-none"
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

      {/* Modal perfil */}
      {mostrarPerfil && otroUsuario && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setMostrarPerfil(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-2xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-[#2D1F45] text-lg">Perfil</h3>
              <button onClick={() => setMostrarPerfil(false)} className="text-[#2D1F45]/40 text-xl hover:text-[#2D1F45]">✕</button>
            </div>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C9A8E8] to-[#7C5C9E] flex items-center justify-center text-white font-bold text-2xl overflow-hidden flex-shrink-0">
                {otroUsuario.foto_url
                  ? <img src={otroUsuario.foto_url} alt="" className="w-full h-full object-cover" />
                  : (nombreOtro?.[0] ?? '?').toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-[#2D1F45] text-lg">{nombreOtro}</p>
                {otroUsuario.rol && <p className="text-[#2D1F45]/50 text-sm capitalize">{otroUsuario.rol === 'at' ? 'Acompañante Terapéutico' : 'Paciente'}</p>}
              </div>
            </div>
            <div className="space-y-2">
              {otroUsuario.zona && (
                <div className="flex items-center gap-2 text-sm text-[#2D1F45]/70">
                  <span>📍</span><span>{otroUsuario.zona}</span>
                </div>
              )}
              {otroUsuario.modalidad && (
                <div className="flex items-center gap-2 text-sm text-[#2D1F45]/70">
                  <span>🩺</span><span>{otroUsuario.modalidad}</span>
                </div>
              )}
              {otroUsuario.matricula && (
                <div className="flex items-center gap-2 text-sm text-[#2D1F45]/70">
                  <span>📋</span><span>Matrícula: {otroUsuario.matricula}</span>
                </div>
              )}
              {otroUsuario.whatsapp && (
                <div className="flex items-center gap-2 text-sm text-[#2D1F45]/70">
                  <span>📱</span><span>{otroUsuario.whatsapp}</span>
                </div>
              )}
              {otroUsuario.email_contacto && (
                <div className="flex items-center gap-2 text-sm text-[#2D1F45]/70">
                  <span>📧</span><span>{otroUsuario.email_contacto}</span>
                </div>
              )}
              {otroUsuario.especialidades?.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-[#2D1F45]/70">
                  <span>🎯</span>
                  <div className="flex flex-wrap gap-1">
                    {otroUsuario.especialidades.map(e => (
                      <span key={e} className="bg-[#F5F0FA] text-[#7C5C9E] text-xs px-2 py-0.5 rounded-full">{e}</span>
                    ))}
                  </div>
                </div>
              )}
              {otroUsuario.obras_sociales?.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-[#2D1F45]/70">
                  <span>🏥</span>
                  <div className="flex flex-wrap gap-1">
                    {otroUsuario.obras_sociales.map(o => (
                      <span key={o} className="bg-[#F5F0FA] text-[#7C5C9E] text-xs px-2 py-0.5 rounded-full">{o}</span>
                    ))}
                  </div>
                </div>
              )}
              {otroUsuario.descripcion && (
                <div className="mt-3 bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-[#2D1F45]/60 leading-relaxed">{otroUsuario.descripcion}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
