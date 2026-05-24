import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import MensajesTab from '../components/MensajesTab'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import { OBRAS_SOCIALES, ZONAS_ALL } from '../lib/constants'
import ComboInput from '../components/ComboInput'
import toast from 'react-hot-toast'

const ADMIN_ID = 'candeladetapiab@gmail.com'

const NAV_ITEMS = [
  { id: 'perfil',        icon: '👤', label: 'Mi perfil',      disponible: true  },
  { id: 'busquedas',     icon: '📢', label: 'Mis búsquedas',  disponible: true  },
  { id: 'mensajes',      icon: '💬', label: 'Mensajes',        disponible: true  },
  { id: 'soporte',       icon: '🆘', label: 'Soporte',         disponible: true  },
  { id: 'favoritos',     icon: '❤️', label: 'Favoritos',      disponible: false },
  { id: 'configuracion', icon: '⚙️', label: 'Configuración',  disponible: false },
]

function ProximamenteCard({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center text-3xl mb-4">🔒</div>
      <h3 className="font-bold text-[#2D1F45] text-lg mb-2">{label}</h3>
      <p className="text-[#2D1F45]/50 text-sm max-w-xs">Esta sección estará disponible próximamente.</p>
    </div>
  )
}

export default function DashboardPaciente() {
  const { user, profile } = useAuth()
  const [busquedas, setBusquedas] = useState([])
  const [mensajesEnviados, setMensajesEnviados] = useState([])
  const [tab, setTab] = useState('perfil')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [enviandoSoporte, setEnviandoSoporte] = useState(false)
  const [adminUserId, setAdminUserId] = useState("146dced0-5554-4043-b6ae-ad03e3a7f803")

  const { register, handleSubmit, setValue, watch, formState: { isSubmitting } } = useForm()
  const { register: regSoporte, handleSubmit: handleSoporte, reset: resetSoporte, formState: { isSubmitting: enviando } } = useForm()

  const nombrePreview = watch('nombre')
  const apellidoPreview = watch('apellido')

  useEffect(() => {
    if (!user) return
    fetchDatos()
    fetchAdminId()
    setValue('nombre', profile?.nombre ?? '')
    setValue('apellido', profile?.apellido ?? '')
    setValue('obra_social', profile?.obra_social ?? '')
    setValue('zona', profile?.zona ?? '')
    setValue('telefono', profile?.telefono ?? '')
  }, [user, profile])

  async function fetchAdminId() {
    const { data } = await supabase.from('profiles').select('id').eq('id', '146dced0-5554-4043-b6ae-ad03e3a7f803').maybeSingle()
    if (data) setAdminUserId(data.id)
  }

  async function fetchDatos() {
    const [{ data: b }, { data: m }] = await Promise.all([
      supabase.from('busquedas').select('*').eq('paciente_id', user.id).order('created_at', { ascending: false }),
      supabase.from('messages').select('*').eq('sender_id', user.id).order('created_at', { ascending: false }),
    ])
    setBusquedas(b ?? [])
    setMensajesEnviados(m ?? [])
  }

  async function onSubmitPerfil(data) {
    const { error } = await supabase
      .from('at_profiles')
      .update({
        nombre: data.nombre,
        apellido: data.apellido,
        obra_social: data.obra_social,
        zona: data.zona,
        telefono: data.telefono,
      })
      .eq('id', user.id)
    if (error) { toast.error(error.message); return }
    toast.success('Perfil actualizado')
  }

  async function onEnviarSoporte(data) {
    if (!adminUserId) { toast.error('No se pudo encontrar el destinatario'); return }
    setEnviandoSoporte(true)
    try {
      const contenido = `[SOPORTE PACIENTE]
Nombre: ${profile?.nombre ?? ''} ${profile?.apellido ?? ''}
Email: ${user.email}
Rol: Paciente
Zona: ${profile?.zona ?? 'No especificada'}
Obra social: ${profile?.obra_social ?? 'No especificada'}
Teléfono: ${profile?.telefono ?? 'No especificado'}

Asunto: ${data.asunto}

Mensaje:
${data.mensaje}`

      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: adminUserId,
        content: contenido,
      })
      if (error) throw error
      toast.success('Mensaje enviado al soporte')
      resetSoporte()
    } catch (err) {
      toast.error(err.message ?? 'No se pudo enviar el mensaje')
    } finally {
      setEnviandoSoporte(false)
    }
  }

  async function cerrarBusqueda(id) {
    await supabase.from('busquedas').update({ activa: false }).eq('id', id)
    fetchDatos()
    toast.success('Búsqueda cerrada')
  }

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="min-h-screen bg-[#FDF8F4] flex">

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-[#2D1F45] to-[#3d2a1e] z-30 flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>

        <div className="px-6 pt-8 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E8A87C] to-[#c4824a] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {(nombrePreview?.[0] ?? profile?.nombre?.[0] ?? 'P').toUpperCase()}{(apellidoPreview?.[0] ?? profile?.apellido?.[0] ?? '').toUpperCase()}
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">{nombrePreview || profile?.nombre} {apellidoPreview || profile?.apellido}</p>
              <p className="text-white/40 text-xs">Paciente</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setSidebarOpen(false) }}
              disabled={!item.disponible}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${tab === item.id
                  ? 'bg-white/15 text-white'
                  : item.disponible
                    ? 'text-white/60 hover:text-white hover:bg-white/10'
                    : 'text-white/25 cursor-not-allowed'
                }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {!item.disponible && (
                <span className="text-[10px] font-semibold bg-white/10 text-white/40 px-1.5 py-0.5 rounded-full">Pronto</span>
              )}
              {item.id === 'busquedas' && busquedas.length > 0 && (
                <span className="text-[10px] font-bold bg-[#E8A87C] text-white px-1.5 py-0.5 rounded-full">{busquedas.length}</span>
              )}
              {item.id === 'mensajes' && mensajesEnviados.length > 0 && (
                <span className="text-[10px] font-bold bg-[#E8A87C] text-white px-1.5 py-0.5 rounded-full">{mensajesEnviados.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-white/20 text-xs">AcompañarTe · v0.1</p>
        </div>
      </aside>

      {/* CONTENIDO */}
      <main className="flex-1 min-w-0">

        <div className="lg:hidden flex items-center justify-between px-4 py-4 bg-gradient-to-r from-[#2D1F45] to-[#3d2a1e]">
          <button onClick={() => setSidebarOpen(true)} className="text-white text-xl">☰</button>
          <span className="text-white font-semibold text-sm">AcompañarTe</span>
          <div className="w-7" />
        </div>

        <div className="max-w-3xl mx-auto px-4 lg:px-8 py-8">

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#2D1F45]">{saludo}, {nombrePreview || profile?.nombre} 👋</h1>
            <p className="text-[#2D1F45]/40 text-sm mt-1">{NAV_ITEMS.find(n => n.id === tab)?.label}</p>
          </div>

          {/* PERFIL */}
          {tab === 'perfil' && (
            <form onSubmit={handleSubmit(onSubmitPerfil)} className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h2 className="font-bold text-xs uppercase tracking-wide text-[#2D1F45]/40">Datos personales</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#2D1F45]/50 mb-1.5 block">Nombre</label>
                    <input {...register('nombre', { required: true })}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#2D1F45] focus:outline-none focus:ring-2 focus:ring-[#E8A87C]/40" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#2D1F45]/50 mb-1.5 block">Apellido</label>
                    <input {...register('apellido', { required: true })}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#2D1F45] focus:outline-none focus:ring-2 focus:ring-[#E8A87C]/40" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#2D1F45]/50 mb-1.5 block">Teléfono</label>
                  <input {...register('telefono')} placeholder="Ej: 1134567890"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#2D1F45] focus:outline-none focus:ring-2 focus:ring-[#E8A87C]/40" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h2 className="font-bold text-xs uppercase tracking-wide text-[#2D1F45]/40">Cobertura y zona</h2>
                <div>
                  <label className="text-xs font-semibold text-[#2D1F45]/50 mb-1.5 block">Obra social</label>
                  <ComboInput listId="obra-dashboard-paciente" options={OBRAS_SOCIALES}
                    placeholder="Escribí o elegí tu obra social..." {...register('obra_social')} />
                  <p className="text-xs text-[#2D1F45]/35 mt-1">Podés escribir libremente si no está en la lista.</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#2D1F45]/50 mb-1.5 block">Zona</label>
                  <ComboInput listId="zona-dashboard-paciente" options={ZONAS_ALL}
                    placeholder="Escribí o elegí tu zona..." {...register('zona')} />
                </div>
              </div>

              <button type="submit" disabled={isSubmitting}
                className="w-full bg-[#E8A87C] hover:bg-[#d4956a] text-white font-semibold py-3.5 rounded-2xl transition-colors shadow-sm">
                {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>
          )}

          {/* BÚSQUEDAS */}
          {tab === 'busquedas' && (
            <div className="space-y-4">
              <Link to="/publicar-busqueda"
                className="flex items-center justify-center gap-2 w-full bg-[#E8A87C] hover:bg-[#d4956a] text-white font-semibold py-3.5 rounded-2xl transition-colors shadow-sm">
                <span>📢</span> Nueva búsqueda
              </Link>
              {busquedas.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-12 px-6">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="font-semibold text-[#2D1F45]/60 text-sm">No publicaste búsquedas todavía</p>
                  <p className="text-[#2D1F45]/35 text-xs mt-1">Publicá una búsqueda para que los ATs te encuentren.</p>
                </div>
              ) : (
                busquedas.map(b => (
                  <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        b.activa ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-100 text-[#2D1F45]/40'
                      }`}>
                        {b.activa ? '● Activa' : 'Cerrada'}
                      </span>
                      <span className="text-xs text-[#2D1F45]/30">
                        {new Date(b.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                      </span>
                    </div>
                    <p className="text-sm text-[#2D1F45]/70 mb-3 leading-relaxed">{b.descripcion}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-[#2D1F45]/50">
                      {b.zona && <span className="bg-gray-50 px-2 py-1 rounded-lg">📍 {b.zona}</span>}
                      {b.obra_social && <span className="bg-gray-50 px-2 py-1 rounded-lg">🏥 {b.obra_social}</span>}
                      {b.especialidad && <span className="bg-gray-50 px-2 py-1 rounded-lg">🎯 {b.especialidad}</span>}
                    </div>
                    {b.activa && (
                      <button onClick={() => cerrarBusqueda(b.id)}
                        className="mt-4 text-xs text-[#2D1F45]/40 hover:text-red-500 transition-colors font-medium">
                        Cerrar búsqueda ×
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* MENSAJES */}
          {tab === 'mensajes' && <MensajesTab />}

          {tab === 'mensajes_OLD' && (
            <div className="space-y-3">
              {mensajesEnviados.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-12 px-6">
                  <div className="text-4xl mb-3">💬</div>
                  <p className="font-semibold text-[#2D1F45]/60 text-sm">No enviaste mensajes todavía</p>
                  <p className="text-[#2D1F45]/35 text-xs mt-1">Cuando contactes un AT, el mensaje aparecerá acá.</p>
                </div>
              ) : (
                mensajesEnviados.map(m => (
                  <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E8A87C] to-[#c4824a] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          AT
                        </div>
                        <span className="font-semibold text-sm text-[#2D1F45]">Mensaje enviado</span>
                      </div>
                      <span className="text-xs text-[#2D1F45]/30">
                        {new Date(m.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <p className="text-[#2D1F45]/60 text-sm leading-relaxed bg-gray-50 rounded-xl px-4 py-3">{m.content}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* SOPORTE */}
          {tab === 'soporte' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F5F0FA] flex items-center justify-center text-xl">🆘</div>
                  <div>
                    <p className="font-bold text-[#2D1F45] text-sm">Contactar soporte</p>
                    <p className="text-[#2D1F45]/40 text-xs">Te respondemos a la brevedad</p>
                  </div>
                </div>
                <form onSubmit={handleSoporte(onEnviarSoporte)} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#2D1F45]/50 mb-1.5 block">Asunto</label>
                    <input {...regSoporte('asunto', { required: true })}
                      placeholder="¿En qué te podemos ayudar?"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#2D1F45] focus:outline-none focus:ring-2 focus:ring-[#E8A87C]/40" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#2D1F45]/50 mb-1.5 block">Mensaje</label>
                    <textarea {...regSoporte('mensaje', { required: true })}
                      placeholder="Contanos tu consulta o problema con el mayor detalle posible..."
                      rows={5}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#2D1F45] focus:outline-none focus:ring-2 focus:ring-[#E8A87C]/40 resize-none" />
                  </div>
                  <div className="bg-[#F5F0FA] rounded-xl p-4 text-xs text-[#2D1F45]/50 space-y-1">
                    <p className="font-semibold text-[#2D1F45]/70 mb-2">Datos que se enviarán junto con tu mensaje:</p>
                    <p>👤 Nombre: {profile?.nombre} {profile?.apellido}</p>
                    <p>📧 Email: {user?.email}</p>
                    <p>🧑 Rol: Paciente</p>
                    {profile?.zona && <p>📍 Zona: {profile.zona}</p>}
                    {profile?.obra_social && <p>🏥 Obra social: {profile.obra_social}</p>}
                    {profile?.telefono && <p>📱 Teléfono: {profile.telefono}</p>}
                  </div>
                  <button type="submit" disabled={enviandoSoporte}
                    className="w-full bg-[#E8A87C] hover:bg-[#d4956a] text-white font-semibold py-3.5 rounded-2xl transition-colors shadow-sm">
                    {enviandoSoporte ? 'Enviando...' : 'Enviar mensaje'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {tab === 'favoritos'     && <ProximamenteCard label="Favoritos" />}
          {tab === 'configuracion' && <ProximamenteCard label="Configuración" />}

        </div>
      </main>
    </div>
  )
}




