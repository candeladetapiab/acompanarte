import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'

const ADMIN_EMAIL = 'candeladetapiab@gmail.com'

const NAV_ITEMS = [
  { id: 'stats',         icon: '📊', label: 'Estadísticas'   },
  { id: 'ats',           icon: '👩‍⚕️', label: 'ATs'           },
  { id: 'pacientes',     icon: '🧑', label: 'Pacientes'      },
  { id: 'busquedas',     icon: '📢', label: 'Búsquedas'      },
  { id: 'sesiones',      icon: '📅', label: 'Sesiones'       },
  { id: 'suscripciones', icon: '💳', label: 'Suscripciones'  },
]

export default function AdminPanel() {
  const { user } = useAuth()
  const [tab, setTab] = useState('stats')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState({ ats: 0, pacientes: 0, mensajes: 0, busquedas: 0, sesiones: 0 })
  const [ats, setAts] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [busquedas, setBusquedas] = useState([])
  const [sesiones, setSesiones] = useState([])
  const [mensajes, setMensajes] = useState([])
  const [metricasBusquedas, setMetricasBusquedas] = useState({ porZona: {}, porObraSocial: {}, porEspecialidad: {}, activas: 0, cerradas: 0 })

  if (!user) return <Navigate to="/login" />
  if (user.email !== ADMIN_EMAIL) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">🔒</div>
        <p className="text-white font-semibold">Acceso restringido</p>
        <p className="text-white/40 text-sm mt-1">No tenés permisos para ver esta página.</p>
      </div>
    </div>
  )

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    const [
      { data: atsData },
      { data: mensajesData },
      { data: busquedasData },
      { data: sesionesData },
      { data: pacientesData },
    ] = await Promise.all([
      supabase.from('at_profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('messages').select('*').eq('receiver_id', user.id).order('created_at', { ascending: false }),
      supabase.from('busquedas').select('*').order('created_at', { ascending: false }),
      supabase.from('sessions').select('*').order('fecha', { ascending: false }),
      supabase.from('profiles').select('id, nombre, apellido, email, created_at').eq('rol', 'paciente').order('created_at', { ascending: false }),
    ])

    const atsList = atsData ?? []
    const msgs = mensajesData ?? []
    const busquedasList = busquedasData ?? []
    const sesionesList = sesionesData ?? []
    const pacientesList = pacientesData ?? []

    // Métricas de búsquedas
    const porZona = {}
    const porObraSocial = {}
    const porEspecialidad = {}
    let activas = 0
    let cerradas = 0
    for (const b of busquedasList) {
      if (b.activa) activas++; else cerradas++
      if (b.zona) porZona[b.zona] = (porZona[b.zona] || 0) + 1
      if (b.obra_social) porObraSocial[b.obra_social] = (porObraSocial[b.obra_social] || 0) + 1
      if (b.especialidad) porEspecialidad[b.especialidad] = (porEspecialidad[b.especialidad] || 0) + 1
    }

    setAts(atsList)
    setPacientes(pacientesList)
    setMensajes(msgs)
    setBusquedas(busquedasList)
    setSesiones(sesionesList)
    setMetricasBusquedas({ porZona, porObraSocial, porEspecialidad, activas, cerradas })
    setStats({
      ats: atsList.length,
      pacientes: pacientesList.length,
      mensajes: msgs.length,
      busquedas: busquedasList.length,
      sesiones: sesionesList.length,
    })
    setLoading(false)
  }

  async function toggleActivoAT(id, activo) {
    await supabase.from('at_profiles').update({ activo: !activo }).eq('id', id)
    fetchAll()
  }

  function TopList({ data, label }) {
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 5)
    const max = sorted[0]?.[1] || 1
    if (!sorted.length) return <p className="text-white/20 text-xs">Sin datos todavía.</p>
    return (
      <div className="space-y-2">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-3">{label}</p>
        {sorted.map(([nombre, cant]) => (
          <div key={nombre} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-white/70 text-xs truncate">{nombre}</span>
                <span className="text-white/40 text-xs ml-2 flex-shrink-0">{cant}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500/60 rounded-full" style={{ width: `${(cant / max) * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="min-h-screen bg-gray-950 flex">

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed top-0 left-0 h-full w-60 bg-gray-900 border-r border-white/5 z-30 flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>

        <div className="px-5 pt-7 pb-5 border-b border-white/5">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-xs font-bold">A</div>
            <div>
              <p className="text-white font-semibold text-sm">Admin</p>
              <p className="text-white/30 text-xs">AcompañarTe</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => { setTab(item.id); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${tab === item.id ? 'bg-violet-600/20 text-violet-300' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-white/5">
          <p className="text-white/15 text-xs">Panel interno · v0.1</p>
        </div>
      </aside>

      {/* CONTENIDO */}
      <main className="flex-1 min-w-0 overflow-auto">

        <div className="lg:hidden flex items-center justify-between px-4 py-4 bg-gray-900 border-b border-white/5">
          <button onClick={() => setSidebarOpen(true)} className="text-white/60 text-xl">☰</button>
          <span className="text-white font-semibold text-sm">Admin</span>
          <div className="w-7" />
        </div>

        <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8">

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">{saludo}, Candela 👋</h1>
            <p className="text-white/30 text-sm mt-1">Panel de administración · {NAV_ITEMS.find(n => n.id === tab)?.label}</p>
          </div>

          {loading && (
            <div className="text-white/30 text-sm">Cargando datos...</div>
          )}

          {/* ESTADÍSTICAS */}
          {!loading && tab === 'stats' && (
            <div className="space-y-6">
              {/* Fila 1: usuarios */}
              <div>
                <p className="text-white/30 text-xs font-semibold uppercase tracking-wide mb-3">Usuarios</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-violet-600 to-purple-800 rounded-2xl p-5">
                    <div className="text-2xl mb-3">👩‍⚕️</div>
                    <div className="text-3xl font-bold text-white">{stats.ats}</div>
                    <div className="text-white/60 text-xs mt-1">ATs registrados</div>
                    <div className="text-white/40 text-xs mt-1">{ats.filter(a => a.activo).length} activos · {ats.filter(a => !a.activo).length} inactivos</div>
                  </div>
                  <div className="bg-gradient-to-br from-pink-600 to-rose-800 rounded-2xl p-5">
                    <div className="text-2xl mb-3">🧑</div>
                    <div className="text-3xl font-bold text-white">{stats.pacientes}</div>
                    <div className="text-white/60 text-xs mt-1">Pacientes registrados</div>
                    <div className="text-white/40 text-xs mt-1">En búsqueda de AT</div>
                  </div>
                </div>
              </div>

              {/* Fila 2: actividad */}
              <div>
                <p className="text-white/30 text-xs font-semibold uppercase tracking-wide mb-3">Actividad</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5">
                    <div className="text-2xl mb-3">💬</div>
                    <div className="text-3xl font-bold text-white">{stats.mensajes}</div>
                    <div className="text-white/60 text-xs mt-1">Mensajes</div>
                    <div className="text-white/40 text-xs mt-1">Recibidos por soporte</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl p-5">
                    <div className="text-2xl mb-3">📢</div>
                    <div className="text-3xl font-bold text-white">{stats.busquedas}</div>
                    <div className="text-white/60 text-xs mt-1">Búsquedas</div>
                    <div className="text-white/40 text-xs mt-1">{metricasBusquedas.activas} activas</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-5">
                    <div className="text-2xl mb-3">📅</div>
                    <div className="text-3xl font-bold text-white">{stats.sesiones}</div>
                    <div className="text-white/60 text-xs mt-1">Sesiones</div>
                    <div className="text-white/40 text-xs mt-1">{sesiones.filter(s => s.estado === 'confirmada').length} confirmadas</div>
                  </div>
                </div>
              </div>

              {/* Últimos ATs */}
              <div className="bg-gray-900 rounded-2xl border border-white/5 p-5">
                <h3 className="text-white font-semibold text-sm mb-4">Últimos ATs registrados</h3>
                <div className="space-y-3">
                  {ats.slice(0, 5).map(at => (
                    <div key={at.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center text-violet-300 text-xs font-bold">
                          {at.nombre?.[0]}{at.apellido?.[0]}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{at.nombre} {at.apellido}</p>
                          <p className="text-white/30 text-xs">{at.zona ?? 'Sin zona'}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${at.activo ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {at.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Últimos mensajes recibidos */}
              {mensajes.length > 0 && (
                <div className="bg-gray-900 rounded-2xl border border-white/5 p-5">
                  <h3 className="text-white font-semibold text-sm mb-4">Últimos mensajes recibidos</h3>
                  <div className="space-y-3">
                    {mensajes.slice(0, 3).map(m => (
                      <div key={m.id} className="bg-white/3 rounded-xl p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-white/50 text-xs font-medium">Mensaje de soporte</span>
                          <span className="text-white/20 text-xs">{new Date(m.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                        </div>
                        <p className="text-white/60 text-sm">{m.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ATs */}
          {!loading && tab === 'ats' && (
            <div className="space-y-3">
              <p className="text-white/30 text-xs">{ats.length} ATs registrados · {ats.filter(a => a.activo).length} activos · {ats.filter(a => !a.activo).length} inactivos</p>
              {ats.map(at => (
                <div key={at.id} className="bg-gray-900 rounded-2xl border border-white/5 p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-300 font-bold text-sm">
                        {at.nombre?.[0]}{at.apellido?.[0]}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{at.nombre} {at.apellido}</p>
                        <p className="text-white/30 text-xs mt-0.5">{at.zona ?? 'Sin zona'} · {at.modalidad ?? '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${at.activo ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {at.activo ? 'Activo' : 'Inactivo'}
                      </span>
                      <button onClick={() => toggleActivoAT(at.id, at.activo)}
                        className="text-xs text-white/20 hover:text-white/60 transition-colors border border-white/10 rounded-lg px-2 py-1">
                        {at.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {at.precio && <span className="text-xs bg-white/5 text-white/40 px-2 py-1 rounded-lg">💰 {at.precio}</span>}
                    {at.whatsapp && <span className="text-xs bg-white/5 text-white/40 px-2 py-1 rounded-lg">📱 {at.whatsapp}</span>}
                    {at.obras_sociales?.length > 0 && <span className="text-xs bg-white/5 text-white/40 px-2 py-1 rounded-lg">🏥 {at.obras_sociales.length} obras sociales</span>}
                    {at.especialidades?.length > 0 && <span className="text-xs bg-white/5 text-white/40 px-2 py-1 rounded-lg">🎯 {at.especialidades.length} especialidades</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PACIENTES */}
          {!loading && tab === 'pacientes' && (
            <div className="space-y-3">
              <p className="text-white/30 text-xs">{pacientes.length} pacientes registrados</p>
              {pacientes.length === 0 ? (
                <div className="bg-gray-900 rounded-2xl border border-white/5 p-8 text-center">
                  <div className="text-4xl mb-3">🧑</div>
                  <p className="text-white/50 font-medium text-sm">No hay pacientes registrados todavía.</p>
                </div>
              ) : (
                pacientes.map(p => (
                  <div key={p.id} className="bg-gray-900 rounded-2xl border border-white/5 p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-pink-600/20 flex items-center justify-center text-pink-300 font-bold text-sm">
                        {p.nombre?.[0]}{p.apellido?.[0]}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{p.nombre} {p.apellido}</p>
                        <p className="text-white/30 text-xs mt-0.5">
                          Registrado el {new Date(p.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* BÚSQUEDAS con métricas */}
          {!loading && tab === 'busquedas' && (
            <div className="space-y-6">
              {/* Resumen */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-900 rounded-2xl border border-white/5 p-4 text-center">
                  <div className="text-2xl font-bold text-white">{busquedas.length}</div>
                  <div className="text-white/40 text-xs mt-1">Total</div>
                </div>
                <div className="bg-gray-900 rounded-2xl border border-green-500/10 p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{metricasBusquedas.activas}</div>
                  <div className="text-white/40 text-xs mt-1">Activas</div>
                </div>
                <div className="bg-gray-900 rounded-2xl border border-white/5 p-4 text-center">
                  <div className="text-2xl font-bold text-white/40">{metricasBusquedas.cerradas}</div>
                  <div className="text-white/40 text-xs mt-1">Cerradas</div>
                </div>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-gray-900 rounded-2xl border border-white/5 p-5">
                  <TopList data={metricasBusquedas.porZona} label="Por zona" />
                </div>
                <div className="bg-gray-900 rounded-2xl border border-white/5 p-5">
                  <TopList data={metricasBusquedas.porObraSocial} label="Por obra social" />
                </div>
                <div className="bg-gray-900 rounded-2xl border border-white/5 p-5">
                  <TopList data={metricasBusquedas.porEspecialidad} label="Por especialidad" />
                </div>
              </div>

              {/* Lista */}
              <div>
                <p className="text-white/30 text-xs mb-3">{busquedas.length} búsquedas · {metricasBusquedas.activas} activas</p>
                <div className="space-y-3">
                  {busquedas.map(b => (
                    <div key={b.id} className="bg-gray-900 rounded-2xl border border-white/5 p-5">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${b.activa ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/30'}`}>
                          {b.activa ? '● Activa' : 'Cerrada'}
                        </span>
                        <span className="text-xs text-white/20">
                          {new Date(b.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-white/70 text-sm leading-relaxed mt-2">{b.descripcion}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {b.zona && <span className="text-xs bg-white/5 text-white/40 px-2 py-1 rounded-lg">📍 {b.zona}</span>}
                        {b.obra_social && <span className="text-xs bg-white/5 text-white/40 px-2 py-1 rounded-lg">🏥 {b.obra_social}</span>}
                        {b.especialidad && <span className="text-xs bg-white/5 text-white/40 px-2 py-1 rounded-lg">🎯 {b.especialidad}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SESIONES */}
          {!loading && tab === 'sesiones' && (
            <div className="space-y-3">
              <p className="text-white/30 text-xs">{sesiones.length} sesiones totales · {sesiones.filter(s => s.estado === 'confirmada').length} confirmadas · {sesiones.filter(s => s.estado === 'realizada').length} realizadas</p>
              {sesiones.map(s => (
                <div key={s.id} className="bg-gray-900 rounded-2xl border border-white/5 p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium text-sm">{s.paciente_nombre}</p>
                      <p className="text-white/30 text-xs mt-0.5">
                        {new Date(s.fecha + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {' · '}{s.hora?.slice(0, 5)} hs · {s.duracion_minutos} min · {s.modalidad}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      s.estado === 'confirmada' ? 'bg-green-500/10 text-green-400' :
                      s.estado === 'realizada'  ? 'bg-blue-500/10 text-blue-400' :
                      s.estado === 'cancelada'  ? 'bg-red-500/10 text-red-400' :
                      'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {s.estado}
                    </span>
                  </div>
                  {s.notas && <p className="text-white/30 text-xs mt-2 bg-white/3 rounded-lg px-3 py-2">{s.notas}</p>}
                </div>
              ))}
            </div>
          )}

          {/* SUSCRIPCIONES */}
          {!loading && tab === 'suscripciones' && (
            <div className="bg-gray-900 rounded-2xl border border-white/5 p-8 text-center">
              <div className="text-4xl mb-3">💳</div>
              <p className="text-white/50 font-medium text-sm">Suscripciones</p>
              <p className="text-white/25 text-xs mt-1 max-w-xs mx-auto">Disponible cuando integres Mercado Pago. Por ahora no hay suscripciones activas.</p>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}