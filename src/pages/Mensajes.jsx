import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'

export default function Mensajes() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [conversaciones, setConversaciones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchConversaciones()
  }, [user])

  async function fetchConversaciones() {
    setLoading(true)

    // Traer todos los mensajes donde el usuario es sender o receiver
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

    // Agrupar por el "otro" usuario
    const conversMap = {}
    msgs.forEach(m => {
      const otroId = m.sender_id === user.id ? m.receiver_id : m.sender_id
      if (!conversMap[otroId]) {
        conversMap[otroId] = { otroId, ultimoMensaje: m, total: 0 }
      }
      conversMap[otroId].total++
    })

    // Traer nombres de los otros usuarios
    const otroIds = Object.keys(conversMap)
    const { data: perfiles } = await supabase
      .from('at_profiles')
      .select('id, nombre, apellido, foto_url')
      .in('id', otroIds)

    const perfilesMap = {}
    perfiles?.forEach(p => { perfilesMap[p.id] = p })

    const lista = Object.values(conversMap).map(c => ({
      ...c,
      nombre: perfilesMap[c.otroId]
        ? `${perfilesMap[c.otroId].nombre ?? ''} ${perfilesMap[c.otroId].apellido ?? ''}`.trim()
        : 'Usuario',
      foto: perfilesMap[c.otroId]?.foto_url ?? null,
    }))

    setConversaciones(lista)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F5F0FA]">
      <div className="bg-gradient-to-br from-[#2D1F45] via-[#4a2d6b] to-[#7C5C9E] px-4 pt-8 pb-12">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => navigate(-1)} className="text-white/50 text-sm mb-4 hover:text-white transition-colors">
            ← Volver
          </button>
          <h1 className="text-white text-2xl font-bold">Mensajes</h1>
          <p className="text-white/50 text-sm mt-1">{conversaciones.length} conversación{conversaciones.length !== 1 ? 'es' : ''}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4 pb-12">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary-500" />
            </div>
          ) : conversaciones.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-ink/50 font-medium text-sm">No tenés conversaciones todavía.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {conversaciones.map(c => (
                <button
                  key={c.otroId}
                  onClick={() => navigate(`/mensajes/${c.otroId}`)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C9A8E8] to-[#7C5C9E] flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
                    {c.foto
                      ? <img src={c.foto} alt="" className="w-full h-full object-cover" />
                      : (c.nombre?.[0] ?? '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-ink">{c.nombre}</p>
                    <p className="text-xs text-ink/45 mt-0.5 truncate">{c.ultimoMensaje.content}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs text-ink/30">
                      {new Date(c.ultimoMensaje.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-ink/30 text-lg">→</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
