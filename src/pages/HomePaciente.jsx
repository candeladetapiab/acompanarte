import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import { OBRAS_SOCIALES } from '../lib/constants'
import { useUnreadMessages } from '../hooks/useUnreadMessages'

function StarRating({ value }) {
  return (
    <span className="flex items-center gap-0.5">
      <span className="text-yellow-400 text-sm">★</span>
      <span className="text-sm font-medium text-ink">{value?.toFixed(1)}</span>
    </span>
  )
}

export default function HomePaciente() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { unreadCount } = useUnreadMessages()
  const [ats, setAts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [obraFiltro, setObraFiltro] = useState('')

  useEffect(() => {
    fetchATs()
  }, [obraFiltro])

  async function fetchATs() {
    setLoading(true)
    let query = supabase
      .from('at_profiles')
      .select('*')
      .eq('activo', true)

    if (obraFiltro) query = query.contains('obras_sociales', [obraFiltro])

    const { data } = await query.order('created_at', { ascending: false })
    setAts(data ?? [])
    setLoading(false)
  }

  const filtrados = search
    ? ats.filter(at =>
        `${at.nombre ?? ''} ${at.apellido ?? ''}`.toLowerCase().includes(search.toLowerCase()) ||
        at.especialidades?.some(e => e.toLowerCase().includes(search.toLowerCase())) ||
        at.zona?.toLowerCase().includes(search.toLowerCase())
      )
    : ats

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="min-h-screen bg-[#F5F0FA]">

      {/* Hero header — terracota para diferenciar del AT */}
      <div className="bg-gradient-to-br from-[#2D1F45] via-[#6b3a2d] to-[#E8A87C] px-4 pt-8 pb-20">
        <div className="max-w-2xl mx-auto">
          <p className="text-[#E8A87C]/70 text-sm font-medium mb-1">{saludo} 👋</p>
          <h1 className="text-white text-3xl font-bold tracking-tight">
            {profile?.nombre ?? 'Bienvenido/a'}
          </h1>
          <p className="text-white/50 text-sm mt-1">Encontrá tu acompañante terapéutico ideal</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-12 pb-12">

        {/* Buscador flotante */}
        <div className="bg-white rounded-2xl shadow-lg shadow-[#E8A87C]/20 border border-orange-100 p-4 mb-6">
          <div className="relative mb-3">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30 text-lg">🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Nombre, especialidad o zona..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-ink placeholder:text-ink/35 focus:outline-none focus:ring-2 focus:ring-[#E8A87C]/40 focus:border-[#E8A87C]/50 transition-all"
            />
          </div>

          {/* Filtros obra social */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {['', ...OBRAS_SOCIALES.slice(0, 8)].map((o, i) => (
              <button
                key={i}
                onClick={() => setObraFiltro(o)}
                className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap border transition-all flex-shrink-0 font-medium ${
                  obraFiltro === o
                    ? 'bg-[#E8A87C] text-white border-[#E8A87C] shadow-sm'
                    : 'border-gray-200 text-ink/55 bg-white hover:border-[#E8A87C]/50'
                }`}
              >
                {o || 'Todas'}
              </button>
            ))}
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Link
            to="/dashboard/paciente"
            className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 hover:border-[#E8A87C]/40 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl group-hover:bg-orange-100 transition-colors">
              👤
            </div>
            <div>
              <p className="font-semibold text-sm text-ink">Mi perfil</p>
              <p className="text-xs text-ink/40">Ver y editar</p>
            </div>
          </Link>
          <Link
            to="/publicar-busqueda"
            className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 hover:border-[#E8A87C]/40 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl group-hover:bg-orange-100 transition-colors">
              📢
            </div>
            <div>
              <p className="font-semibold text-sm text-ink">Publicar búsqueda</p>
              <p className="text-xs text-ink/40">Que te encuentren</p>
            </div>
          </Link>
          <button
            onClick={() => navigate('/mensajes')}
            className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 hover:border-[#E8A87C]/40 hover:shadow-md transition-all group relative"
          >
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl group-hover:bg-orange-100 transition-colors">
              💬
            </div>
            <div>
              <p className="font-semibold text-sm text-ink">Mensajes</p>
              <p className="text-xs text-ink/40">Mis chats</p>
            </div>
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 bg-[#E8A87C] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Lista de ATs */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-bold text-ink text-base">Acompañantes disponibles</h2>
            {filtrados.length > 0 && (
              <span className="text-xs text-ink/40">{filtrados.length} encontrado{filtrados.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#E8A87C]" />
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-ink/50 text-sm">No encontramos ATs con esos criterios.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtrados.map(at => (
                <article
                  key={at.id}
                  className="flex gap-4 p-4 hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/at/${at.id}`)}
                >
                  {/* Avatar */}
                  {at.foto_url || at.avatar_url ? (
                    <img
                      src={at.foto_url || at.avatar_url}
                      alt=""
                      className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C9A8E8] to-[#7C5C9E] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {at.nombre?.[0]}{at.apellido?.[0]}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-ink text-sm">{at.nombre} {at.apellido}</p>
                        {at.especialidades?.[0] && (
                          <p className="text-xs text-ink/45 mt-0.5">{at.especialidades[0]}</p>
                        )}
                      </div>
                      {at.promedio_reseñas > 0 && <StarRating value={at.promedio_reseñas} />}
                    </div>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {at.zona && (
                        <span className="text-xs text-ink/40 flex items-center gap-0.5">
                          <span>📍</span>{at.zona}
                        </span>
                      )}
                      {at.modalidad && (
                        <span className="text-xs text-ink/40">
                          · {at.modalidad}
                        </span>
                      )}
                    </div>

                    {at.obras_sociales?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {at.obras_sociales.slice(0, 2).map(o => (
                          <span key={o} className="bg-primary-50 text-primary-600 text-xs px-2 py-0.5 rounded-full">
                            {o}
                          </span>
                        ))}
                        {at.obras_sociales.length > 2 && (
                          <span className="text-xs text-ink/30 self-center">+{at.obras_sociales.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Precio + botón */}
                  <div className="flex flex-col items-end justify-between flex-shrink-0">
                    {at.precio && (
                      <span className="text-sm font-bold text-[#E8A87C]">{at.precio}</span>
                    )}
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); navigate(`/at/${at.id}`) }}
                      className="bg-[#7C5C9E] hover:bg-[#6a4e8a] text-white text-xs font-medium py-1.5 px-3 rounded-xl transition-colors mt-2"
                    >
                      Ver →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
