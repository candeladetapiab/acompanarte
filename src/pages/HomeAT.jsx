import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import toast from 'react-hot-toast'
import { useUnreadMessages } from '../hooks/useUnreadMessages'

export default function HomeAT() {
  const { user, profile } = useAuth()
  const [mensajes, setMensajes] = useState([])
  const [stats, setStats] = useState({ solicitudes: 0, reseñas: 0, calificacion: 0 })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { unreadCount } = useUnreadMessages()

  useEffect(() => {
    fetchData()
  }, [user])

  async function fetchData() {
    const [{ data: msgs }, { count: reseñasCount }, { data: perfilAT }] = await Promise.all([
      supabase
        .from('messages')
        .select('*')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('at_id', user.id),
      supabase
        .from('at_profiles')
        .select('calificacion_promedio')
        .eq('id', user.id)
        .single(),
    ])

    const mensajesData = msgs ?? []

    if (mensajesData.length > 0) {
      const senderIds = [...new Set(mensajesData.map(m => m.sender_id).filter(Boolean))]
      const { data: perfiles } = await supabase
        .from('at_profiles')
        .select('id, nombre, apellido')
        .in('id', senderIds)

      const perfilesMap = {}
      perfiles?.forEach(p => { perfilesMap[p.id] = p })

      const mensajesConNombre = mensajesData.map(m => ({
        ...m,
        _senderNombre: perfilesMap[m.sender_id]
          ? `${perfilesMap[m.sender_id].nombre ?? ''} ${perfilesMap[m.sender_id].apellido ?? ''}`.trim()
          : 'Paciente',
      }))
      setMensajes(mensajesConNombre)
    } else {
      setMensajes([])
    }

    setStats({
      solicitudes: mensajesData.length,
      reseñas: reseñasCount ?? 0,
      calificacion: perfilAT?.calificacion_promedio ?? 0,
    })
    setLoading(false)
  }

  function getIniciales(nombre) {
    if (!nombre || nombre === 'Paciente') return 'P'
    const parts = nombre.trim().split(' ').filter(Boolean)
    return parts.slice(0, 2).map(p => p[0].toUpperCase()).join('')
  }

  function responder(id, aceptar) {
    toast.success(aceptar ? '¡Solicitud aceptada!' : 'Solicitud declinada')
    setMensajes(prev => prev.filter(m => m.id !== id))
    setStats(prev => ({ ...prev, solicitudes: prev.solicitudes - 1 }))
  }

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="min-h-screen bg-[#F5F0FA]">
      <div className="bg-gradient-to-br from-[#2D1F45] via-[#4a2d6b] to-[#7C5C9E] px-4 pt-8 pb-16">
        <div className="max-w-2xl mx-auto">
          <p className="text-[#C9A8E8]/70 text-sm font-medium mb-1">{saludo} 👋</p>
          <h1 className="text-white text-3xl font-bold tracking-tight">{profile?.nombre ?? ''}</h1>
          <p className="text-[#C9A8E8]/60 text-sm mt-1">Acompañante Terapéutico · AcompañarTe</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-8 pb-12">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Solicitudes', value: stats.solicitudes, icon: '📩', gradient: 'from-[#7C5C9E] to-[#9B7BC0]' },
            { label: 'Reseñas', value: stats.reseñas, icon: '⭐', gradient: 'from-[#E8A87C] to-[#F0BC94]' },
            { label: 'Calificación', value: stats.calificacion ? `${stats.calificacion} ★` : '–', icon: '📊', gradient: 'from-[#C9A8E8] to-[#DCC4F0]' },
          ].map(s => (
            <div key={s.label} className={`bg-gradient-to-br ${s.gradient} rounded-2xl p-4 text-white shadow-lg shadow-primary-200/30`}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold leading-none">{s.value}</div>
              <div className="text-white/70 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Acciones rápidas */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Link to="/dashboard/at"
            className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-center gap-2 hover:border-primary-200 hover:shadow-md transition-all group">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-xl group-hover:bg-primary-100 transition-colors">👤</div>
            <p className="font-semibold text-xs text-ink text-center">Mi perfil</p>
          </Link>
          <button
            onClick={() => navigate('/mensajes')}
            className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-center gap-2 hover:border-primary-200 hover:shadow-md transition-all group relative">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-xl group-hover:bg-primary-100 transition-colors">💬</div>
            <p className="font-semibold text-xs text-ink text-center">Mensajes</p>
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 bg-[#E8A87C] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <Link to="/busquedas"
            className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-center gap-2 hover:border-primary-200 hover:shadow-md transition-all group">
            <div className="w-10 h-10 bg-accent-50 rounded-xl flex items-center justify-center text-xl group-hover:bg-accent-100 transition-colors">🔍</div>
            <p className="font-semibold text-xs text-ink text-center">Búsquedas</p>
          </Link>
        </div>

        {/* Solicitudes nuevas */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-bold text-ink text-base">Solicitudes nuevas</h2>
            {stats.solicitudes > 0 && (
              <span className="bg-[#7C5C9E] text-white text-xs font-bold px-2 py-0.5 rounded-full">{stats.solicitudes}</span>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary-500" />
            </div>
          ) : mensajes.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">📭</div>
              <p className="text-ink font-semibold text-sm">Todo tranquilo por acá</p>
              <p className="text-ink/40 text-xs mt-1 mb-5">Cuando alguien te contacte, aparecerá acá.</p>
              <Link to="/dashboard/at" className="inline-flex items-center gap-2 bg-[#7C5C9E] hover:bg-[#6a4e8a] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
                Completar mi perfil →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {mensajes.map(m => (
                <div key={m.id} className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C9A8E8] to-[#7C5C9E] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {getIniciales(m._senderNombre)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-ink">{m._senderNombre}</span>
                        <div className="flex items-center gap-2">
                          <span className="bg-[#E8A87C]/20 text-[#c4824a] text-xs font-semibold px-2 py-0.5 rounded-full">Nueva</span>
                          <span className="text-xs text-ink/30">
                            {new Date(m.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-ink/60 mt-0.5 leading-relaxed">{m.content}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => responder(m.id, true)} className="flex-1 bg-[#7C5C9E] hover:bg-[#6a4e8a] text-white font-medium py-2.5 rounded-xl text-sm transition-colors">
                      ✓ Aceptar
                    </button>
                    <button onClick={() => responder(m.id, false)} className="flex-1 bg-gray-50 hover:bg-gray-100 text-ink/60 font-medium py-2.5 rounded-xl text-sm transition-colors border border-gray-200">
                      Declinar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
