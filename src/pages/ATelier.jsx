import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import toast from 'react-hot-toast'

const CATEGORIAS = ['Todos', 'Materiales para pacientes', 'Guías para familias', 'Herramientas para ATs', 'Cursos', 'Otros']

function ModalCompra({ recurso, onClose }) {
  const { user } = useAuth()

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-[#2D1F45] text-lg">Comprar recurso</h3>
          <button onClick={onClose} className="text-[#2D1F45]/40 hover:text-[#2D1F45] text-xl">✕</button>
        </div>

        <div className="flex gap-4 mb-5">
          {recurso.imagen_url
            ? <img src={recurso.imagen_url} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
            : <div className="w-16 h-16 rounded-xl bg-[#F5F0FA] flex items-center justify-center text-2xl flex-shrink-0">📄</div>}
          <div>
            <p className="font-semibold text-[#2D1F45]">{recurso.titulo}</p>
            <p className="text-xs text-[#2D1F45]/50 mt-0.5">{recurso.categoria}</p>
            <p className="font-bold text-[#E8A87C] text-lg mt-1">${Number(recurso.precio).toLocaleString('es-AR')}</p>
          </div>
        </div>

        <div className="bg-[#F5F0FA] rounded-xl p-4 mb-5">
          <p className="text-sm font-semibold text-[#7C5C9E] mb-2">💬 ¿Cómo comprar?</p>
          <p className="text-sm text-[#2D1F45]/70 mb-3">Contactá directamente al AT para coordinar el pago. Próximamente podrás pagar con Mercado Pago.</p>
          {recurso._at_whatsapp && (
            <a
              href={`https://wa.me/${recurso._at_whatsapp}?text=Hola! Quiero comprar tu recurso "${recurso.titulo}" del ATelier de AcompañarTe.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors w-full justify-center"
            >
              💬 Contactar por WhatsApp
            </a>
          )}
          {recurso._at_email && (
            <a
              href={`mailto:${recurso._at_email}?subject=Compra de recurso: ${recurso.titulo}&body=Hola! Quiero comprar tu recurso "${recurso.titulo}" del ATelier de AcompañarTe.`}
              className="flex items-center gap-2 bg-[#7C5C9E] hover:bg-[#6a4e8a] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors w-full justify-center mt-2"
            >
              ✉️ Contactar por email
            </a>
          )}
        </div>

        <button onClick={onClose} className="w-full border border-gray-200 text-[#2D1F45]/60 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
          Cerrar
        </button>
      </div>
    </div>
  )
}

export default function ATelier() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [recursos, setRecursos] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoriaActiva, setCategoriaActiva] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')
  const [recursoSeleccionado, setRecursoSeleccionado] = useState(null)

  useEffect(() => { fetchRecursos() }, [])

  async function fetchRecursos() {
    setLoading(true)
    const { data: recursosData } = await supabase
      .from('marketplace_recursos')
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: false })

    if (!recursosData || recursosData.length === 0) { setRecursos([]); setLoading(false); return }

    const atIds = [...new Set(recursosData.map(r => r.at_id))]
    const { data: perfiles } = await supabase
      .from('at_profiles')
      .select('id, nombre, apellido, foto_url, whatsapp, email_contacto')
      .in('id', atIds)

    const perfilesMap = {}
    perfiles?.forEach(p => { perfilesMap[p.id] = p })

    setRecursos(recursosData.map(r => ({
      ...r,
      _at_nombre: perfilesMap[r.at_id] ? `${perfilesMap[r.at_id].nombre ?? ''} ${perfilesMap[r.at_id].apellido ?? ''}`.trim() : 'AT',
      _at_foto: perfilesMap[r.at_id]?.foto_url,
      _at_whatsapp: perfilesMap[r.at_id]?.whatsapp,
      _at_email: perfilesMap[r.at_id]?.email_contacto,
    })))
    setLoading(false)
  }

  const filtrados = recursos.filter(r => {
    const matchCategoria = categoriaActiva === 'Todos' || r.categoria === categoriaActiva
    const matchBusqueda = !busqueda || r.titulo.toLowerCase().includes(busqueda.toLowerCase()) || r.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
    return matchCategoria && matchBusqueda
  })

  return (
    <div className="min-h-screen bg-[#F5F0FA]">

      {/* Header */}
      <div className="bg-gradient-to-br from-[#2D1F45] via-[#4a2d6b] to-[#7C5C9E] px-4 pt-10 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-white text-4xl font-bold mb-2">ATelier</h1>
          <p className="text-[#C9A8E8]/70 text-sm">Recursos creados por Acompañantes Terapéuticos para pacientes, familias y colegas</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8 pb-12">

        {/* Buscador */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#C9A8E8]/20 p-4 mb-6">
          <div className="relative mb-3">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D1F45]/30 text-lg">🔍</span>
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar recursos..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-[#2D1F45] placeholder:text-[#2D1F45]/35 focus:outline-none focus:ring-2 focus:ring-[#7C5C9E]/30 transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {CATEGORIAS.map(c => (
              <button key={c} onClick={() => setCategoriaActiva(c)}
                className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap border transition-all flex-shrink-0 font-medium ${
                  categoriaActiva === c
                    ? 'bg-[#7C5C9E] text-white border-[#7C5C9E]'
                    : 'border-gray-200 text-[#2D1F45]/55 bg-white hover:border-[#7C5C9E]/50'
                }`}>{c}</button>
            ))}
          </div>
        </div>

        {/* Resultados */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#7C5C9E]" />
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-[#2D1F45]/50 text-sm">No hay recursos con esos criterios todavía.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-[#2D1F45]/40 mb-4">{filtrados.length} recurso{filtrados.length !== 1 ? 's' : ''} encontrado{filtrados.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtrados.map(r => (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {r.imagen_url
                    ? <img src={r.imagen_url} alt="" className="w-full h-40 object-cover" />
                    : <div className="w-full h-40 bg-gradient-to-br from-[#F5F0FA] to-[#E8E0F5] flex items-center justify-center text-5xl">📄</div>
                  }
                  <div className="p-4">
                    <span className="text-xs bg-[#F5F0FA] text-[#7C5C9E] px-2 py-0.5 rounded-full font-medium">{r.categoria}</span>
                    <h3 className="font-bold text-[#2D1F45] text-sm mt-2 mb-1 line-clamp-2">{r.titulo}</h3>
                    {r.descripcion && <p className="text-xs text-[#2D1F45]/50 mb-3 line-clamp-2">{r.descripcion}</p>}

                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#C9A8E8] to-[#7C5C9E] flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
                        {r._at_foto
                          ? <img src={r._at_foto} alt="" className="w-full h-full object-cover" />
                          : r._at_nombre?.[0]}
                      </div>
                      <span className="text-xs text-[#2D1F45]/50 truncate">{r._at_nombre}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#E8A87C]">${Number(r.precio).toLocaleString('es-AR')}</span>
                      <button
                        onClick={() => setRecursoSeleccionado(r)}
                        className="bg-[#7C5C9E] hover:bg-[#6a4e8a] text-white text-xs font-medium px-4 py-2 rounded-xl transition-colors"
                      >
                        Comprar →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* CTA para ATs */}
        <div className="mt-10 bg-gradient-to-br from-[#2D1F45] to-[#7C5C9E] rounded-2xl p-6 text-center">
          <p className="text-white font-bold text-lg mb-1">¿Sos AT y querés vender tus recursos?</p>
          <p className="text-[#C9A8E8]/70 text-sm mb-4">Publicá tus materiales y empezá a generar ingresos extra. AcompañarTe retiene solo el 15%.</p>
          <button
            onClick={() => navigate(user ? '/dashboard/at' : '/registro/at')}
            className="bg-[#E8A87C] hover:bg-[#d4946a] text-[#2D1F45] font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            {user ? 'Ir al ATelier →' : 'Registrarme como AT →'}
          </button>
        </div>
      </div>

      {recursoSeleccionado && (
        <ModalCompra recurso={recursoSeleccionado} onClose={() => setRecursoSeleccionado(null)} />
      )}
    </div>
  )
}
