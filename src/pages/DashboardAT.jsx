import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import { ZONAS_ALL, OBRAS_SOCIALES, ESPECIALIDADES } from '../lib/constants'
import ComboInput from '../components/ComboInput'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { id: 'perfil',        icon: '👤', label: 'Mi perfil',      disponible: true  },
  { id: 'estadisticas',  icon: '📊', label: 'Estadísticas',   disponible: true  },
  { id: 'mensajes',      icon: '💬', label: 'Mensajes',        disponible: true  },
  { id: 'agenda',        icon: '📅', label: 'Agenda',          disponible: true  },
  { id: 'marketplace',   icon: '🛍️', label: 'ATelier',         disponible: true  },
  { id: 'facturacion',   icon: '🧾', label: 'Facturación',     disponible: false },
  { id: 'comunidad',     icon: '🤝', label: 'Comunidad',       disponible: false },
  { id: 'configuracion', icon: '⚙️', label: 'Configuración',  disponible: false },
]

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function ProximamenteCard({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#F5F0FA] flex items-center justify-center text-3xl mb-4">🔒</div>
      <h3 className="font-bold text-[#2D1F45] text-lg mb-2">{label}</h3>
      <p className="text-[#2D1F45]/50 text-sm max-w-xs">Esta sección estará disponible próximamente. ¡Estamos trabajando en ello!</p>
      <span className="mt-4 inline-block bg-[#E8A87C]/20 text-[#c4824a] text-xs font-semibold px-3 py-1.5 rounded-full">Próximamente</span>
    </div>
  )
}

function SeccionEstadisticas({ userId }) {
  const [stats, setStats] = useState({ visitas: 0, contactos: 0, reseñas: 0, calificacion: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (userId) fetchStats() }, [userId])

  async function fetchStats() {
    const [{ count: contactos }, { data: perfilAT }] = await Promise.all([
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', userId),
      supabase.from('at_profiles').select('calificacion_promedio').eq('id', userId).single(),
    ])
    const { count: reseñas } = await supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('at_id', userId)
    setStats({ visitas: 0, contactos: contactos ?? 0, reseñas: reseñas ?? 0, calificacion: perfilAT?.calificacion_promedio ?? 0 })
    setLoading(false)
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#7C5C9E]" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#2D1F45] mb-1">Estadísticas del perfil</h2>
        <p className="text-[#2D1F45]/50 text-sm">Resumen de tu actividad en la plataforma</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Visitas al perfil', value: stats.visitas, icon: '👁️', gradient: 'from-[#7C5C9E] to-[#9B7BC0]', nota: 'Disponible pronto' },
          { label: 'Contactos recibidos', value: stats.contactos, icon: '📩', gradient: 'from-[#E8A87C] to-[#F0BC94]' },
          { label: 'Reseñas', value: stats.reseñas, icon: '⭐', gradient: 'from-[#C9A8E8] to-[#DCC4F0]' },
          { label: 'Calificación', value: stats.calificacion ? `${stats.calificacion} ★` : '–', icon: '📈', gradient: 'from-[#7C5C9E] to-[#C9A8E8]' },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.gradient} rounded-2xl p-4 text-white shadow-sm`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold leading-none">{s.value}</div>
            <div className="text-white/70 text-xs mt-1">{s.label}</div>
            {s.nota && <div className="text-white/50 text-xs mt-1 italic">{s.nota}</div>}
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-bold text-[#2D1F45] text-sm mb-4">En qué búsquedas aparecés</h3>
        <div className="flex flex-col gap-3">
          {[{ label: 'Tu zona', pct: 80 }, { label: 'Obras sociales', pct: 60 }, { label: 'Especialidades', pct: 45 }].map(b => (
            <div key={b.label}>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-[#2D1F45]/60">{b.label}</span>
                <span className="text-xs font-semibold text-[#7C5C9E]">{b.pct}%</span>
              </div>
              <div className="h-2 bg-[#F5F0FA] rounded-full">
                <div className="h-2 bg-[#7C5C9E] rounded-full" style={{ width: `${b.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#2D1F45]/40 mt-4 italic">* Completá tu perfil para aparecer en más búsquedas</p>
      </div>
      <div className="bg-[#F5F0FA] border border-[#C9A8E8]/30 rounded-2xl p-5">
        <p className="text-sm font-semibold text-[#7C5C9E] mb-1">💡 Tip para mejorar tu visibilidad</p>
        <p className="text-sm text-[#2D1F45]/70">Completá todas las secciones de tu perfil — foto, descripción, especialidades y obras sociales — para aparecer en más búsquedas y recibir más contactos.</p>
      </div>
    </div>
  )
}

const CATEGORIAS = ['Materiales para pacientes', 'Guías para familias', 'Herramientas para ATs', 'Cursos', 'Otros']

function SeccionATelier({ userId, perfil }) {
  const [recursos, setRecursos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [nuevoRecurso, setNuevoRecurso] = useState({
    titulo: '', descripcion: '', precio: '', categoria: 'Materiales para pacientes',
    archivo_url: '', archivo_nombre: '', archivo_tipo: '', imagen_url: ''
  })

  useEffect(() => { if (userId) fetchRecursos() }, [userId])

  async function fetchRecursos() {
    setLoading(true)
    const { data } = await supabase.from('marketplace_recursos').select('*').eq('at_id', userId).order('created_at', { ascending: false })
    setRecursos(data ?? [])
    setLoading(false)
  }

  async function subirArchivo(e, tipo) {
    const file = e.target.files[0]
    if (!file) return
    setSubiendo(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
      const path = `${userId}/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('marketplace').upload(path, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('marketplace').getPublicUrl(path)
      if (tipo === 'archivo') {
        setNuevoRecurso(p => ({ ...p, archivo_url: publicUrl, archivo_nombre: file.name, archivo_tipo: file.type }))
        toast.success('Archivo subido')
      } else {
        setNuevoRecurso(p => ({ ...p, imagen_url: publicUrl }))
        toast.success('Imagen subida')
      }
    } catch (err) {
      toast.error('No se pudo subir el archivo')
    } finally {
      setSubiendo(false)
      e.target.value = ''
    }
  }

  async function guardarRecurso() {
    if (!nuevoRecurso.titulo || !nuevoRecurso.precio) { toast.error('Completá título y precio'); return }
    setGuardando(true)
    const { error } = await supabase.from('marketplace_recursos').insert({
      ...nuevoRecurso, at_id: userId, precio: parseFloat(nuevoRecurso.precio)
    })
    if (error) { toast.error('No se pudo guardar'); setGuardando(false); return }
    toast.success('Recurso publicado en el ATelier')
    setModalAbierto(false)
    setNuevoRecurso({ titulo: '', descripcion: '', precio: '', categoria: 'Materiales para pacientes', archivo_url: '', archivo_nombre: '', archivo_tipo: '', imagen_url: '' })
    setGuardando(false)
    fetchRecursos()
  }

  async function toggleActivo(id, activo) {
    await supabase.from('marketplace_recursos').update({ activo: !activo }).eq('id', id)
    setRecursos(prev => prev.map(r => r.id === id ? { ...r, activo: !activo } : r))
  }

  async function eliminarRecurso(id) {
    await supabase.from('marketplace_recursos').delete().eq('id', id)
    setRecursos(prev => prev.filter(r => r.id !== id))
    toast.success('Recurso eliminado')
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#7C5C9E]" /></div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#2D1F45] mb-1">ATelier</h2>
          <p className="text-[#2D1F45]/50 text-sm">Publicá y vendé tus recursos. AcompañarTe cobra 15% por cada venta.</p>
        </div>
        <button onClick={() => setModalAbierto(true)}
          className="text-sm px-4 py-2 rounded-xl bg-[#7C5C9E] hover:bg-[#6a4e8a] text-white font-medium transition-colors">
          + Publicar recurso
        </button>
      </div>

      {recursos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <div className="text-4xl mb-3">🛍️</div>
          <p className="font-semibold text-[#2D1F45] text-sm mb-1">Todavía no publicaste recursos</p>
          <p className="text-[#2D1F45]/40 text-xs mb-5 max-w-xs mx-auto">Subí guías, materiales, cursos o herramientas y empezá a generar ingresos extra.</p>
          <button onClick={() => setModalAbierto(true)} className="bg-[#7C5C9E] hover:bg-[#6a4e8a] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
            + Publicar mi primer recurso
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {recursos.map(r => (
            <div key={r.id} className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm ${!r.activo ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-4">
                {r.imagen_url ? (
                  <img src={r.imagen_url} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-[#F5F0FA] flex items-center justify-center text-2xl flex-shrink-0">📄</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[#2D1F45] text-sm">{r.titulo}</p>
                      <p className="text-xs text-[#2D1F45]/50 mt-0.5">{r.categoria}</p>
                    </div>
                    <p className="font-bold text-[#E8A87C] text-sm flex-shrink-0">${Number(r.precio).toLocaleString('es-AR')}</p>
                  </div>
                  {r.descripcion && <p className="text-xs text-[#2D1F45]/50 mt-1 line-clamp-2">{r.descripcion}</p>}
                  {r.archivo_nombre && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-xs bg-[#F5F0FA] text-[#7C5C9E] px-2 py-0.5 rounded-full">📎 {r.archivo_nombre}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs text-[#2D1F45]/40">{r.ventas} ventas</span>
                    <span className="text-[#2D1F45]/20">·</span>
                    <button onClick={() => toggleActivo(r.id, r.activo)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${r.activo ? 'bg-green-50 text-green-600 hover:bg-red-50 hover:text-red-500' : 'bg-gray-50 text-[#2D1F45]/40 hover:bg-green-50 hover:text-green-600'}`}>
                      {r.activo ? '✓ Activo' : '✗ Inactivo'}
                    </button>
                    <button onClick={() => eliminarRecurso(r.id)} className="text-xs text-red-400 hover:text-red-600 px-2">Eliminar</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info comisión */}
      <div className="bg-[#F5F0FA] border border-[#C9A8E8]/30 rounded-2xl p-4">
        <p className="text-sm font-semibold text-[#7C5C9E] mb-1">💰 ¿Cómo funciona el ATelier?</p>
        <p className="text-sm text-[#2D1F45]/70">Publicás tu recurso con el precio que querés. Cuando alguien lo compra, recibís el 85% del valor. AcompañarTe retiene el 15% como comisión de plataforma.</p>
      </div>

      {/* Modal nuevo recurso */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[#2D1F45] text-lg">Publicar recurso en ATelier</h3>
              <button onClick={() => setModalAbierto(false)} className="text-[#2D1F45]/40 hover:text-[#2D1F45] text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2D1F45]/60 mb-1.5">Título *</label>
                <input value={nuevoRecurso.titulo} onChange={e => setNuevoRecurso(p => ({...p, titulo: e.target.value}))}
                  className="input-field" placeholder="Ej: Guía de actividades para adolescentes" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#2D1F45]/60 mb-1.5">Descripción</label>
                <textarea value={nuevoRecurso.descripcion} onChange={e => setNuevoRecurso(p => ({...p, descripcion: e.target.value}))}
                  className="input-field resize-none" rows={3} placeholder="Describí qué incluye este recurso..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2D1F45]/60 mb-1.5">Precio (ARS) *</label>
                  <input type="number" value={nuevoRecurso.precio} onChange={e => setNuevoRecurso(p => ({...p, precio: e.target.value}))}
                    className="input-field" placeholder="5000" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2D1F45]/60 mb-1.5">Categoría</label>
                  <select value={nuevoRecurso.categoria} onChange={e => setNuevoRecurso(p => ({...p, categoria: e.target.value}))} className="input-field">
                    {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#2D1F45]/60 mb-1.5">Archivo del recurso</label>
                <label className={`flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-[#7C5C9E]/40 transition-colors ${subiendo ? 'opacity-50' : ''}`}>
                  <span className="text-2xl">📎</span>
                  <div>
                    <p className="text-sm font-medium text-[#2D1F45]">{nuevoRecurso.archivo_nombre || 'Subir archivo'}</p>
                    <p className="text-xs text-[#2D1F45]/40">PDF, ZIP, MP4, o cualquier formato</p>
                  </div>
                  <input type="file" className="sr-only" onChange={e => subirArchivo(e, 'archivo')} disabled={subiendo} />
                </label>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#2D1F45]/60 mb-1.5">Imagen de portada (opcional)</label>
                <label className={`flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-[#7C5C9E]/40 transition-colors ${subiendo ? 'opacity-50' : ''}`}>
                  {nuevoRecurso.imagen_url
                    ? <img src={nuevoRecurso.imagen_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    : <span className="text-2xl">🖼️</span>}
                  <div>
                    <p className="text-sm font-medium text-[#2D1F45]">{nuevoRecurso.imagen_url ? 'Imagen cargada' : 'Subir imagen'}</p>
                    <p className="text-xs text-[#2D1F45]/40">JPG o PNG · Recomendado 800x600px</p>
                  </div>
                  <input type="file" accept="image/*" className="sr-only" onChange={e => subirArchivo(e, 'imagen')} disabled={subiendo} />
                </label>
              </div>
              {nuevoRecurso.precio && (
                <div className="bg-[#F5F0FA] rounded-xl p-3">
                  <p className="text-xs text-[#2D1F45]/60">Tu ganancia por venta: <span className="font-bold text-[#7C5C9E]">${(parseFloat(nuevoRecurso.precio || 0) * 0.85).toLocaleString('es-AR', {maximumFractionDigits: 0})}</span> <span className="text-[#2D1F45]/40">(85% de ${parseFloat(nuevoRecurso.precio || 0).toLocaleString('es-AR')})</span></p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAbierto(false)} className="flex-1 border border-gray-200 text-[#2D1F45]/60 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={guardarRecurso} disabled={guardando || subiendo}
                className="flex-1 bg-[#7C5C9E] hover:bg-[#6a4e8a] text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                {guardando ? 'Publicando...' : subiendo ? 'Subiendo archivo...' : 'Publicar en ATelier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SeccionAgenda({ userId }) {
  const [sesiones, setSesiones] = useState([])
  const [loading, setLoading] = useState(true)
  const [vistaCalendario, setVistaCalendario] = useState(false)
  const [mesActual, setMesActual] = useState(new Date())
  const [modalAbierto, setModalAbierto] = useState(false)
  const [nuevaSesion, setNuevaSesion] = useState({
    paciente_nombre: '', fecha: '', hora: '09:00', duracion_minutos: 60, modalidad: 'Presencial', notas: '', estado: 'confirmada'
  })
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { if (userId) fetchSesiones() }, [userId])

  async function fetchSesiones() {
    setLoading(true)
    const { data } = await supabase.from('sessions').select('*').eq('at_id', userId)
      .order('fecha', { ascending: true }).order('hora', { ascending: true })
    setSesiones(data ?? [])
    setLoading(false)
  }

  async function guardarSesion() {
    if (!nuevaSesion.paciente_nombre || !nuevaSesion.fecha || !nuevaSesion.hora) {
      toast.error('Completá los campos obligatorios'); return
    }
    setGuardando(true)
    const { error } = await supabase.from('sessions').insert({ ...nuevaSesion, at_id: userId })
    if (error) { toast.error('No se pudo guardar la sesión'); setGuardando(false); return }
    toast.success('Sesión agregada')
    setModalAbierto(false)
    setNuevaSesion({ paciente_nombre: '', fecha: '', hora: '09:00', duracion_minutos: 60, modalidad: 'Presencial', notas: '', estado: 'confirmada' })
    setGuardando(false)
    fetchSesiones()
  }

  async function cambiarEstado(id, estado) {
    await supabase.from('sessions').update({ estado }).eq('id', id)
    setSesiones(prev => prev.map(s => s.id === id ? { ...s, estado } : s))
  }

  async function eliminarSesion(id) {
    await supabase.from('sessions').delete().eq('id', id)
    setSesiones(prev => prev.filter(s => s.id !== id))
    toast.success('Sesión eliminada')
  }

  const hoy = new Date()
  const sesionesProximas = sesiones.filter(s => new Date(s.fecha) >= new Date(hoy.toDateString()))
  const sesionesAnteriores = sesiones.filter(s => new Date(s.fecha) < new Date(hoy.toDateString()))

  const primerDia = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1)
  const ultimoDia = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0)
  const diasCalendario = []
  for (let i = 0; i < primerDia.getDay(); i++) diasCalendario.push(null)
  for (let d = 1; d <= ultimoDia.getDate(); d++) diasCalendario.push(d)

  const sesionesEnDia = (dia) => {
    if (!dia) return []
    const fechaStr = `${mesActual.getFullYear()}-${String(mesActual.getMonth()+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
    return sesiones.filter(s => s.fecha === fechaStr)
  }

  const estadoColor = {
    confirmada: 'bg-[#7C5C9E]/10 text-[#7C5C9E]',
    pendiente: 'bg-[#E8A87C]/20 text-[#c4824a]',
    cancelada: 'bg-red-50 text-red-500',
    realizada: 'bg-green-50 text-green-600'
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#7C5C9E]" /></div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#2D1F45] mb-1">Agenda de sesiones</h2>
          <p className="text-[#2D1F45]/50 text-sm">{sesiones.length} sesiones registradas</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setVistaCalendario(!vistaCalendario)}
            className="text-sm px-4 py-2 rounded-xl border border-gray-200 text-[#2D1F45]/60 hover:bg-gray-50 transition-colors">
            {vistaCalendario ? '📋 Lista' : '📅 Calendario'}
          </button>
          <button onClick={() => setModalAbierto(true)}
            className="text-sm px-4 py-2 rounded-xl bg-[#7C5C9E] hover:bg-[#6a4e8a] text-white font-medium transition-colors">
            + Nueva sesión
          </button>
        </div>
      </div>

      {vistaCalendario && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth()-1))} className="text-[#2D1F45]/50 hover:text-[#2D1F45] px-3 py-1 text-lg">←</button>
            <h3 className="font-bold text-[#2D1F45]">{MESES[mesActual.getMonth()]} {mesActual.getFullYear()}</h3>
            <button onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth()+1))} className="text-[#2D1F45]/50 hover:text-[#2D1F45] px-3 py-1 text-lg">→</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
            {DIAS_SEMANA.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: '600', color: 'rgba(45,31,69,0.4)', padding: '4px 0' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {diasCalendario.map((dia, i) => {
              const eventos = sesionesEnDia(dia)
              const esHoy = dia &&
                new Date().getDate() === dia &&
                new Date().getMonth() === mesActual.getMonth() &&
                new Date().getFullYear() === mesActual.getFullYear()
              return (
                <div key={i} style={{
                  minHeight: '52px', borderRadius: '10px', padding: '4px',
                  background: esHoy ? '#F5F0FA' : 'transparent',
                  outline: esHoy ? '2px solid rgba(124,92,158,0.3)' : 'none'
                }}>
                  {dia && (
                    <div style={{ textAlign: 'center', fontWeight: '500', fontSize: '12px', marginBottom: '2px', color: esHoy ? '#7C5C9E' : 'rgba(45,31,69,0.6)' }}>
                      {dia}
                    </div>
                  )}
                  {eventos.slice(0, 2).map(e => (
                    <div key={e.id} style={{
                      background: '#7C5C9E', color: 'white', borderRadius: '4px',
                      padding: '1px 4px', fontSize: '10px', overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px'
                    }}>{e.paciente_nombre}</div>
                  ))}
                  {eventos.length > 2 && (
                    <div style={{ color: '#7C5C9E', fontSize: '10px', textAlign: 'center' }}>+{eventos.length - 2}</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {sesionesProximas.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="font-bold text-[#2D1F45] text-sm">Próximas sesiones</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {sesionesProximas.map(s => (
              <div key={s.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F5F0FA] flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[#7C5C9E] leading-none">{new Date(s.fecha+'T00:00:00').getDate()}</span>
                  <span className="text-xs text-[#7C5C9E]/60">{MESES[new Date(s.fecha+'T00:00:00').getMonth()].slice(0,3)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#2D1F45] text-sm">{s.paciente_nombre}</p>
                  <p className="text-xs text-[#2D1F45]/50">{s.hora.slice(0,5)} · {s.duracion_minutos} min · {s.modalidad}</p>
                  {s.notas && <p className="text-xs text-[#2D1F45]/40 mt-0.5 truncate">{s.notas}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${estadoColor[s.estado]}`}>{s.estado}</span>
                  <select value={s.estado} onChange={e => cambiarEstado(s.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-[#2D1F45]/60">
                    <option value="confirmada">Confirmada</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="cancelada">Cancelada</option>
                    <option value="realizada">Realizada</option>
                  </select>
                  <button onClick={() => eliminarSesion(s.id)} className="text-red-400 hover:text-red-600 text-xs px-2">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sesionesAnteriores.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm opacity-70">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="font-bold text-[#2D1F45]/60 text-sm">Sesiones anteriores ({sesionesAnteriores.length})</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {sesionesAnteriores.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[#2D1F45]/40 leading-none">{new Date(s.fecha+'T00:00:00').getDate()}</span>
                  <span className="text-xs text-[#2D1F45]/30">{MESES[new Date(s.fecha+'T00:00:00').getMonth()].slice(0,3)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#2D1F45]/60 text-sm">{s.paciente_nombre}</p>
                  <p className="text-xs text-[#2D1F45]/40">{s.hora.slice(0,5)} · {s.modalidad}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${estadoColor[s.estado]}`}>{s.estado}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {sesiones.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <div className="text-4xl mb-3">📅</div>
          <p className="font-semibold text-[#2D1F45] text-sm mb-1">No tenés sesiones cargadas</p>
          <p className="text-[#2D1F45]/40 text-xs mb-5">Agregá tu primera sesión para empezar a organizar tu agenda.</p>
          <button onClick={() => setModalAbierto(true)} className="bg-[#7C5C9E] hover:bg-[#6a4e8a] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
            + Agregar sesión
          </button>
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[#2D1F45] text-lg">Nueva sesión</h3>
              <button onClick={() => setModalAbierto(false)} className="text-[#2D1F45]/40 hover:text-[#2D1F45] text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2D1F45]/60 mb-1.5">Paciente *</label>
                <input value={nuevaSesion.paciente_nombre} onChange={e => setNuevaSesion(p => ({...p, paciente_nombre: e.target.value}))}
                  className="input-field" placeholder="Nombre del paciente" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2D1F45]/60 mb-1.5">Fecha *</label>
                  <input type="date" value={nuevaSesion.fecha} onChange={e => setNuevaSesion(p => ({...p, fecha: e.target.value}))} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2D1F45]/60 mb-1.5">Hora *</label>
                  <input type="time" value={nuevaSesion.hora} onChange={e => setNuevaSesion(p => ({...p, hora: e.target.value}))} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2D1F45]/60 mb-1.5">Duración</label>
                  <select value={nuevaSesion.duracion_minutos} onChange={e => setNuevaSesion(p => ({...p, duracion_minutos: Number(e.target.value)}))} className="input-field">
                    <option value={30}>30 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                    <option value={120}>120 min</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2D1F45]/60 mb-1.5">Modalidad</label>
                  <select value={nuevaSesion.modalidad} onChange={e => setNuevaSesion(p => ({...p, modalidad: e.target.value}))} className="input-field">
                    <option>Presencial</option>
                    <option>Virtual</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#2D1F45]/60 mb-1.5">Estado</label>
                <select value={nuevaSesion.estado} onChange={e => setNuevaSesion(p => ({...p, estado: e.target.value}))} className="input-field">
                  <option value="confirmada">Confirmada</option>
                  <option value="pendiente">Pendiente</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#2D1F45]/60 mb-1.5">Notas</label>
                <textarea value={nuevaSesion.notas} onChange={e => setNuevaSesion(p => ({...p, notas: e.target.value}))}
                  className="input-field resize-none" rows={2} placeholder="Notas opcionales..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAbierto(false)} className="flex-1 border border-gray-200 text-[#2D1F45]/60 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={guardarSesion} disabled={guardando} className="flex-1 bg-[#7C5C9E] hover:bg-[#6a4e8a] text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                {guardando ? 'Guardando...' : 'Guardar sesión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardAT() {
  const { user, profile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mensajes, setMensajes] = useState([])
  const [tab, setTab] = useState(location.state?.tab ?? 'perfil')
  const [uploading, setUploading] = useState(false)
  const [obrasSelec, setObrasSelec] = useState([])
  const [espSelec, setEspSelec] = useState([])
  const [saveFeedback, setSaveFeedback] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { register, handleSubmit, setValue, getValues, watch, formState: { isSubmitting } } = useForm({
    defaultValues: {
      activo: true, nombre: '', apellido: '', zona: '', descripcion: '',
      modalidad: 'Presencial', precio: '', whatsapp: '', email_contacto: '',
      foto_url: '', matricula: '', telefono: '', experiencia: '',
    },
  })
  const fotoUrlPreview = watch('foto_url')
  const nombrePreview = watch('nombre')
  const apellidoPreview = watch('apellido')

  useEffect(() => {
    if (!user) return
    fetchPerfilAT()
    fetchMensajes()
  }, [user])

  async function fetchPerfilAT() {
    const { data: atData, error } = await supabase.from('at_profiles').select('*').eq('id', user.id).maybeSingle()
    if (error) { toast.error('No se pudo cargar tu perfil'); return }
    setValue('nombre', atData?.nombre ?? profile?.nombre ?? '')
    setValue('apellido', atData?.apellido ?? profile?.apellido ?? '')
    setValue('zona', atData?.zona ?? '')
    setValue('descripcion', atData?.descripcion ?? '')
    setValue('modalidad', atData?.modalidad ?? 'Presencial')
    setValue('precio', atData?.precio ?? '')
    setValue('whatsapp', atData?.whatsapp ?? '')
    setValue('email_contacto', atData?.email_contacto ?? '')
    setValue('foto_url', atData?.foto_url ?? '')
    setValue('matricula', atData?.matricula ?? '')
    setValue('telefono', atData?.telefono ?? '')
    setValue('experiencia', atData?.experiencia ?? '')
    setValue('activo', atData?.activo ?? true)
    setObrasSelec(atData?.obras_sociales ?? [])
    setEspSelec(atData?.especialidades ?? [])
  }

  async function fetchMensajes() {
    const { data, error } = await supabase.from('messages').select('*').eq('receiver_id', user.id).order('created_at', { ascending: false })
    if (error) { toast.error('No se pudieron cargar tus mensajes'); return }
    const msgs = data ?? []
    if (msgs.length === 0) { setMensajes([]); return }
    const senderIds = [...new Set(msgs.map(m => m.sender_id).filter(Boolean))]
    const { data: perfiles } = await supabase.from('at_profiles').select('id, nombre, apellido').in('id', senderIds)
    const perfilesMap = {}
    perfiles?.forEach(p => { perfilesMap[p.id] = p })
    setMensajes(msgs.map(m => ({
      ...m,
      _senderNombre: perfilesMap[m.sender_id]
        ? `${perfilesMap[m.sender_id].nombre ?? ''} ${perfilesMap[m.sender_id].apellido ?? ''}`.trim()
        : 'Paciente',
    })))
  }

  async function uploadAvatar(e) {
    const file = e.target.files[0]
    if (!file || !user) return
    if (!file.type.startsWith('image/')) { toast.error('Seleccioná un archivo de imagen válido'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('La imagen debe pesar menos de 2MB'); return }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path = `${user.id}/avatar-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      setValue('foto_url', publicUrl)
      const { error: savePhotoError } = await supabase.from('at_profiles').upsert({
        id: user.id, nombre: (getValues('nombre') ?? '').trim(),
        apellido: (getValues('apellido') ?? '').trim(), foto_url: publicUrl,
      }, { onConflict: 'id' })
      if (savePhotoError) throw savePhotoError
      toast.success('Foto actualizada')
    } catch (error) {
      toast.error(error.message ?? 'No se pudo actualizar la foto')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function toggleItem(list, setList, item) {
    setList(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item])
  }

  async function onSubmit(data) {
    setSaveFeedback(null)
    const atPayload = {
      id: user.id,
      nombre: data.nombre?.trim() ?? '', apellido: data.apellido?.trim() ?? '',
      descripcion: data.descripcion?.trim() ?? '', especialidades: espSelec,
      modalidad: data.modalidad ?? 'Presencial', zona: data.zona?.trim() ?? '',
      precio: data.precio?.trim() ?? '', whatsapp: data.whatsapp?.trim() ?? '',
      email_contacto: data.email_contacto?.trim() ?? '', foto_url: data.foto_url?.trim() || null,
      activo: Boolean(data.activo), obras_sociales: obrasSelec,
      matricula: data.matricula?.trim() ?? '', telefono: data.telefono?.trim() ?? '',
      experiencia: data.experiencia?.trim() ?? '',
    }
    const { error } = await supabase.from('at_profiles').upsert(atPayload, { onConflict: 'id' })
    if (error) {
      setSaveFeedback({ type: 'error', message: 'No se pudo guardar. Revisá los datos e intentá de nuevo.' })
      toast.error(error.message); return
    }
    setSaveFeedback({ type: 'success', message: 'Perfil guardado correctamente.' })
    toast.success('Perfil guardado')
    await fetchPerfilAT()
  }

  const tabActual = NAV_ITEMS.find(n => n.id === tab)

  return (
    <div className="min-h-screen bg-[#F5F0FA] flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 h-full w-60 bg-white border-r border-gray-100 z-30 flex flex-col transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C9A8E8] to-[#7C5C9E] flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
              {fotoUrlPreview
                ? <img src={fotoUrlPreview} alt="" className="w-full h-full object-cover" />
                : `${nombrePreview?.[0] ?? ''}${apellidoPreview?.[0] ?? ''}`}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[#2D1F45] text-sm truncate">{nombrePreview} {apellidoPreview}</p>
              <p className="text-xs text-[#2D1F45]/40">Acompañante Terapéutico</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => { setTab(item.id); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left
                ${tab === item.id ? 'bg-[#F5F0FA] text-[#7C5C9E] font-semibold' : 'text-[#2D1F45]/60 hover:bg-gray-50 hover:text-[#2D1F45]'}`}>
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {!item.disponible && (
                <span className="text-xs bg-[#E8A87C]/20 text-[#c4824a] px-1.5 py-0.5 rounded-full font-medium">Pronto</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button onClick={() => navigate('/panel-at')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#2D1F45]/50 hover:bg-gray-50 hover:text-[#2D1F45] transition-all">
            <span>←</span><span>Volver al panel</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="lg:hidden flex items-center gap-3 bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="text-[#2D1F45] p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span className="font-semibold text-[#2D1F45] text-sm">{tabActual?.icon} {tabActual?.label}</span>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8">

          {tab === 'perfil' && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-[#2D1F45] mb-1">Mi perfil</h2>
                <p className="text-[#2D1F45]/50 text-sm">Tu información visible en la plataforma</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#F5F0FA] flex items-center justify-center text-[#7C5C9E] font-bold text-xl overflow-hidden flex-shrink-0">
                  {fotoUrlPreview ? <img src={fotoUrlPreview} alt="" className="w-full h-full object-cover" /> : `${nombrePreview?.[0] ?? ''}${apellidoPreview?.[0] ?? ''}`}
                </div>
                <div>
                  <label className="inline-block bg-[#F5F0FA] hover:bg-[#ede6f5] text-[#7C5C9E] text-sm font-medium px-4 py-2 rounded-xl cursor-pointer transition-colors">
                    {uploading ? 'Subiendo...' : 'Cambiar foto'}
                    <input type="file" accept="image/*" className="sr-only" onChange={uploadAvatar} disabled={uploading} />
                  </label>
                  <p className="text-xs text-[#2D1F45]/40 mt-1">JPG, PNG o WebP · Máx 2MB</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-xs font-semibold text-[#2D1F45]/60 mb-1.5">Nombre</label><input {...register('nombre', { required: true })} className="input-field" /></div>
                  <div><label className="block text-xs font-semibold text-[#2D1F45]/60 mb-1.5">Apellido</label><input {...register('apellido', { required: true })} className="input-field" /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-xs font-semibold text-[#2D1F45]/60 mb-1.5">Matrícula</label><input {...register('matricula')} className="input-field" /></div>
                  <div><label className="block text-xs font-semibold text-[#2D1F45]/60 mb-1.5">Teléfono</label><input {...register('telefono')} className="input-field" /></div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2D1F45]/60 mb-1.5">Zona de trabajo</label>
                  <ComboInput listId="zona-dashboard-at" options={ZONAS_ALL} placeholder="Escribí o elegí: barrio, ciudad, provincia..." {...register('zona')} />
                  <p className="text-xs text-[#2D1F45]/40 mt-1">Podés escribir libremente si no está en la lista.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2D1F45]/60 mb-1.5">Modalidad</label>
                  <select {...register('modalidad')} className="input-field">
                    <option value="Presencial">Presencial</option>
                    <option value="Virtual">Virtual</option>
                    <option value="Ambas">Ambas</option>
                  </select>
                </div>
                <div><label className="block text-xs font-semibold text-[#2D1F45]/60 mb-1.5">Precio</label><input {...register('precio')} className="input-field" placeholder="Ej: $8000 o A convenir" /></div>
                <div><label className="block text-xs font-semibold text-[#2D1F45]/60 mb-1.5">Descripción</label><textarea {...register('descripcion')} className="input-field resize-none" rows={4} placeholder="Contá tu experiencia, enfoque y lo que ofrecés..." /></div>
                <div><label className="block text-xs font-semibold text-[#2D1F45]/60 mb-1.5">Experiencia</label><textarea {...register('experiencia')} className="input-field resize-none" rows={3} placeholder="Años de experiencia o trayectoria." /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-xs font-semibold text-[#2D1F45]/60 mb-1.5">WhatsApp</label><input {...register('whatsapp')} className="input-field" placeholder="549..." /></div>
                  <div><label className="block text-xs font-semibold text-[#2D1F45]/60 mb-1.5">Email de contacto</label><input type="email" {...register('email_contacto')} className="input-field" /></div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="activo" {...register('activo')} className="rounded border-gray-300 text-[#7C5C9E]" />
                  <label htmlFor="activo" className="text-sm text-[#2D1F45]/70">Perfil activo (visible en búsquedas)</label>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <label className="block text-xs font-semibold text-[#2D1F45]/60 mb-3">Obras sociales que atendés</label>
                <div className="flex flex-wrap gap-2">
                  {OBRAS_SOCIALES.map(o => (
                    <button key={o} type="button" onClick={() => toggleItem(obrasSelec, setObrasSelec, o)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${obrasSelec.includes(o) ? 'bg-[#7C5C9E] text-white border-[#7C5C9E]' : 'border-gray-200 text-[#2D1F45]/70 hover:border-[#7C5C9E]/40'}`}>{o}</button>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <label className="block text-xs font-semibold text-[#2D1F45]/60 mb-3">Especialidades</label>
                <div className="flex flex-wrap gap-2">
                  {ESPECIALIDADES.map(e => (
                    <button key={e} type="button" onClick={() => toggleItem(espSelec, setEspSelec, e)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${espSelec.includes(e) ? 'bg-[#C9A8E8] text-[#2D1F45] border-[#C9A8E8]' : 'border-gray-200 text-[#2D1F45]/70 hover:border-[#C9A8E8]/40'}`}>{e}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <button type="submit" disabled={isSubmitting}
                  className="w-full bg-[#7C5C9E] hover:bg-[#6a4e8a] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Guardando...' : 'Guardar perfil'}
                </button>
                {saveFeedback && (
                  <p className={`text-sm font-medium ${saveFeedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{saveFeedback.message}</p>
                )}
              </div>
            </form>
          )}

          {tab === 'estadisticas' && <SeccionEstadisticas userId={user?.id} />}

          {tab === 'mensajes' && (
            <div className="space-y-4">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-[#2D1F45] mb-1">Mensajes</h2>
                <p className="text-[#2D1F45]/50 text-sm">Todos los mensajes que recibiste</p>
              </div>
              {mensajes.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                  <div className="text-4xl mb-3">💬</div>
                  <p className="text-[#2D1F45]/50 font-medium text-sm">No tenés mensajes todavía.</p>
                  <p className="text-[#2D1F45]/35 text-xs mt-1">Cuando un paciente te contacte, aparecerá acá.</p>
                </div>
              ) : (
                mensajes.map(m => (
                  <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C9A8E8] to-[#7C5C9E] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {(m._senderNombre?.[0] ?? 'P').toUpperCase()}
                        </div>
                        <span className="font-semibold text-sm text-[#2D1F45]">{m._senderNombre}</span>
                      </div>
                      <span className="text-xs text-[#2D1F45]/30">
                        {new Date(m.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <p className="text-[#2D1F45]/70 text-sm leading-relaxed whitespace-pre-line bg-gray-50 rounded-xl px-4 py-3">{m.content}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'agenda'        && <SeccionAgenda userId={user?.id} />}
          {tab === 'marketplace'   && <SeccionATelier userId={user?.id} />}
          {tab === 'facturacion'   && <ProximamenteCard label="Facturación" />}
          {tab === 'comunidad'     && <ProximamenteCard label="Comunidad de ATs" />}
          {tab === 'configuracion' && <ProximamenteCard label="Configuración" />}

        </div>
      </main>
    </div>
  )
}
