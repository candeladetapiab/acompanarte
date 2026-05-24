import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'

export default function MensajesTab() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [conversaciones, setConversaciones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchConversaciones()
  }, [user])

  async function fetchConversaciones() {
    setLoading(true)
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (!msgs || msgs.length === 0) {
      setConversaciones([])
      setLoading(false)
      return
    }

    const conversMap = {}
    msgs.forEach(m => {
      const otroId = m.sender_id === user.id ? m.receiver_id : m.sender_id
      if (!conversMap[otroId]) {
        conversMap[otroId] = { otroId, ultimoMensaje: m, noLeidos: 0 }
      }
      if (m.receiver_id === user.id && !m.leido) {
        conversMap[otroId].noLeidos++
      }
    })

    const otroIds = Object.keys(conversMap)
    const { data: perfiles } = await supabase
      .from('at_profiles')
      .select('id, nombre, apellido, foto_url')
      .in('id', otroIds)

    const perfilesMap = {}
    perfiles?.forEach(p => { perfilesMap[p.id] = p })

    const idsNoEncontrados = otroIds.filter(id => !perfilesMap[id])
    if (idsNoEncontrados.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, nombre, apellido')
        .in('id', idsNoEncontrados)
      profilesData?.forEach(p => { perfilesMap[p.id] = p })
    }

    const lista = Object.values(conversMap)
      .sort((a, b) => new Date(b.ultimoMensaje.created_at) - new Date(a.ultimoMensaje.created_at))
      .map(c => ({
        ...c,
        nombre: perfilesMap[c.otroId]
          ? `${perfilesMap[c.otroId].nombre ?? ''} ${perfilesMap[c.otroId].apellido ?? ''}`.trim()
          : 'Usuario',
        foto: perfilesMap[c.otroId]?.foto_url ?? null,
      }))

    setConversaciones(lista)
    setLoading(false)
  }

  function formatFecha(fecha) {
    const d = new Date(fecha)
    const hoy = new Date()
    const ayer = new Date(hoy)
    ayer.setDate(ayer.getDate() - 1)
    if (d.toDateString() === hoy.toDateString()) {
      return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    } else if (d.toDateString() === ayer.toDateString()) {
      return 'Ayer'
    } else {
      return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
    }
  }

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#7C5C9E]" />
    </div>
  )

  if (conversaciones.length === 0) return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
      <div className="text-4xl mb-3">💬</div>
      <p className="text-[#2D1F45]/50 font-medium text-sm">No tenés conversaciones todavía.</p>
      <p className="text-[#2D1F45]/35 text-xs mt-1">Cuando alguien te contacte, aparecerá acá.</p>
    </div>
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="divide-y divide-gray-50">
        {conversaciones.map(c => (
          <button
            key={c.otroId}
            onClick={() => navigate(`/mensajes/${c.otroId}`)}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors text-left"
          >
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C9A8E8] to-[#7C5C9E] flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                {c.foto
                  ? <img src={c.foto} alt="" className="w-full h-full object-cover" />
                  : (c.nombre?.[0] ?? '?').toUpperCase()}
              </div>
              {c.noLeidos > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#7C5C9E] rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">{c.noLeidos}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className={`text-sm ${c.noLeidos > 0 ? 'font-bold text-[#2D1F45]' : 'font-semibold text-[#2D1F45]'}`}>
                  {c.nombre}
                </p>
                <span className={`text-xs flex-shrink-0 ml-2 ${c.noLeidos > 0 ? 'text-[#7C5C9E] font-semibold' : 'text-[#2D1F45]/30'}`}>
                  {formatFecha(c.ultimoMensaje.created_at)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className={`text-xs truncate ${c.noLeidos > 0 ? 'text-[#2D1F45]/70 font-medium' : 'text-[#2D1F45]/40'}`}>
                  {c.ultimoMensaje.sender_id === user.id ? 'Vos: ' : ''}{c.ultimoMensaje.content}
                </p>
                {c.noLeidos > 0 && (
                  <span className="flex-shrink-0 bg-[#7C5C9E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {c.noLeidos} nuevo{c.noLeidos > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            <span className="text-[#2D1F45]/20 text-lg flex-shrink-0">›</span>
          </button>
        ))}
      </div>
    </div>
  )
}
