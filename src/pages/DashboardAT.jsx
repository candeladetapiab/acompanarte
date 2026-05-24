import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import { ZONAS_ALL, OBRAS_SOCIALES, ESPECIALIDADES } from '../lib/constants'
import ComboInput from '../components/ComboInput'
import toast from 'react-hot-toast'

const ADMIN_EMAIL = 'candeladetapiab@gmail.com'

const NAV_ITEMS = [
  { id: 'perfil',        icon: '👤', label: 'Mi perfil',     disponible: true  },
  { id: 'estadisticas',  icon: '📊', label: 'Estadísticas',  disponible: true  },
  { id: 'mensajes',      icon: '💬', label: 'Mensajes',       disponible: true  },
  { id: 'agenda',        icon: '📅', label: 'Agenda',         disponible: true  },
  { id: 'soporte',       icon: '🆘', label: 'Soporte',        disponible: true  },
  { id: 'marketplace',   icon: '🛍️', label: 'Marketplace',   disponible: false },
  { id: 'facturacion',   icon: '🧾', label: 'Facturación',    disponible: false },
  { id: 'comunidad',     icon: '🤝', label: 'Comunidad',      disponible: false },
  { id: 'configuracion', icon: '⚙️', label: 'Configuración', disponible: false },
]

function ProximamenteCard({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#F5F0FA] flex items-center justify-center text-3xl mb-4">🔒</div>
      <h3 className="font-bold text-[#2D1F45] text-lg mb-2">{label}</h3>
      <p className="text-[#2D1F45]/50 text-sm max-w-xs">Esta sección estará disponible próximamente. Estamos trabajando para vos.</p>
    </div>
  )
}

export default function DashboardAT() {
  const { user, profile } = useAuth()
  const [tab, setTab] = useState('perfil')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [obrasSelec, setObrasSelec] = useState([])
  const [espSelec, setEspSelec] = useState([])
  const [saveFeedback, setSaveFeedback] = useState(null)
  const [mensajes, setMensajes] = useState([])
  const [sesiones, setSesiones] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [modalSesion, setModalSesion] = useState(false)
  const [guardandoSesion, setGuardandoSesion] = useState(false)
  const [stats, setStats] = useState({ mensajes: 0, resenas: 0, calificacion: null })
  const [adminUserId, setAdminUserId] = useState("146dced0-5554-4043-b6ae-ad03e3a7f803")
  const [enviandoSoporte, setEnviandoSoporte] = useState(false)

  const { register, handleSubmit, setValue, getValues, watch, formState: { isSubmitting } } = useForm({
    defaultValues: {
      activo: true, nombre: '', apellido: '', zona: '', descripcion: '',
      modalidad: 'Presencial', precio: '', whatsapp: '', email_contacto: '',
      foto_url: '', matricula: '', telefono: '', experiencia: '',
    },
  })

  const { register: regSesion, handleSubmit: handleSesion, reset: resetSesion, formState: { errors: errSesion } } = useForm({
    defaultValues: { paciente_id: '', fecha: '', hora: '', duracion_minutos: 60, modalidad: 'Presencial', estado: 'confirmada', notas: '' }
  })

  const { register: regSoporte, handleSubmit: handleSoporte, reset: resetSoporte } = useForm()

  const fotoUrlPreview = watch('foto_url')
  const nombrePreview = watch('nombre')
  const apellidoPreview = watch('apellido')

  useEffect(() => {
    if (!user) return
    fetchPerfilAT()
    fetchMensajes()
    fetchSesiones()
    fetchStats()
    fetchAdminId()
  }, [user])

  async function fetchAdminId() {
    const { data } = await supabase.from('profiles').select('id').eq('id', '146dced0-5554-4043-b6ae-ad03e3a7f803').maybeSingle()
    if (data) setAdminUserId(data.id)
  }

  async function fetchPerfilAT() {
    const { data: atData } = await supabase.from('at_profiles').select('*').eq('id', user.id).maybeSingle()
    if (!atData) return
    setValue('nombre', atData.nombre ?? profile?.nombre ?? '')
    setValue('apellido', atData.apellido ?? profile?.apellido ?? '')
    setValue('zona', atData.zona ?? '')
    setValue('descripcion', atData.descripcion ?? '')
    setValue('modalidad', atData.modalidad ?? 'Presencial')
    setValue('precio', atData.precio ?? '')
    setValue('whatsapp', atData.whatsapp ?? '')
    setValue('email_contacto', atData.email_contacto ?? '')
    setValue('foto_url', atData.foto_url ?? '')
    setValue('matricula', atData.matricula ?? '')
    setValue('telefono', atData.telefono ?? '')
    setValue('experiencia', atData.experiencia ?? '')
    setValue('activo', atData.activo ?? true)
    setObrasSelec(atData.obras_sociales ?? [])
    setEspSelec(atData.especialidades ?? [])
  }

  async function fetchStats() {
    const [{ data: msgs }, { data: revs }] = await Promise.all([
      supabase.from('messages').select('id').eq('receiver_id', user.id),
      supabase.from('reviews').select('rating').eq('at_id', user.id),
    ])
    const cal = revs?.length ? (revs.reduce((a, r) => a + r.rating, 0) / revs.length).toFixed(1) : null
    setStats({ mensajes: msgs?.length ?? 0, resenas: revs?.length ?? 0, calificacion: cal })
  }

  async function fetchMensajes() {
    const { data } = await supabase.from('messages').select('*').eq('receiver_id', user.id).order('created_at', { ascending: false })
    const msgs = data ?? []
    if (!msgs.length) { setMensajes([]); return }
    const senderIds = [...new Set(msgs.map(m => m.sender_id).filter(Boolean))]
    const { data: perfiles } = await supabase.from('at_profiles').select('id, nombre, apellido').in('id', senderIds)
    const perfilesMap = {}
    perfiles?.forEach(p => { perfilesMap[p.id] = p })
    const msgsConNombre = msgs.map(m => ({
      ...m,
      _senderNombre: perfilesMap[m.sender_id]
        ? `${perfilesMap[m.sender_id].nombre ?? ''} ${perfilesMap[m.sender_id].apellido ?? ''}`.trim()
        : 'Paciente',
    }))
    setMensajes(msgsConNombre)
    const pacientesUnicos = []
    const seen = new Set()
    for (const m of msgsConNombre) {
      if (m.sender_id && !seen.has(m.sender_id)) {
        seen.add(m.sender_id)
        pacientesUnicos.push({ id: m.sender_id, nombre: m._senderNombre })
      }
    }
    setPacientes(pacientesUnicos)
  }

  async function fetchSesiones() {
    const { data } = await supabase.from('sessions').select('*').eq('at_id', user.id)
      .order('fecha', { ascending: true }).order('hora', { ascending: true })
    setSesiones(data ?? [])
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
      await supabase.from('at_profiles').upsert({
        id: user.id, nombre: (getValues('nombre') ?? '').trim(),
        apellido: (getValues('apellido') ?? '').trim(), foto_url: publicUrl,
      }, { onConflict: 'id' })
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
    const { error } = await supabase.from('at_profiles').upsert({
      id: user.id,
      nombre: data.nombre?.trim() ?? '',
      apellido: data.apellido?.trim() ?? '',
      descripcion: data.descripcion?.trim() ?? '',
      especialidades: espSelec,
      modalidad: data.modalidad ?? 'Presencial',
      zona: data.zona?.trim() ?? '',
      precio: data.precio?.trim() ?? '',
      whatsapp: data.whatsapp?.trim() ?? '',
      email_contacto: data.email_contacto?.trim() ?? '',
      foto_url: data.foto_url?.trim() || null,
      activo: Boolean(data.activo),
      obras_sociales: obrasSelec,
      matricula: data.matricula?.trim() ?? '',
      telefono: data.telefono?.trim() ?? '',
      experiencia: data.experiencia?.trim() ?? '',
    }, { onConflict: 'id' })
    if (error) {
      setSaveFeedback({ type: 'error', message: 'No se pudo guardar. Revisá los datos.' })
      toast.error(error.message)
      return
    }
    setSaveFeedback({ type: 'success', message: 'Perfil guardado correctamente.' })
    toast.success('Perfil guardado')
    await fetchPerfilAT()
  }

  async function onGuardarSesion(data) {
    setGuardandoSesion(true)
    try {
      const paciente = pacientes.find(p => p.id === data.paciente_id)
      const { error } = await supabase.from('sessions').insert({
        at_id: user.id,
        paciente_id: data.paciente_id || null,
        paciente_nombre: paciente?.nombre ?? data.paciente_nombre_libre ?? 'Paciente',
        fecha: data.fecha,
        hora: data.hora,
        duracion_minutos: Number(data.duracion_minutos),
        modalidad: data.modalidad,
        estado: data.estado,
        notas: data.notas?.trim() ?? '',
      })
      if (error) throw error
      toast.success('Sesión agendada')
      setModalSesion(false)
      resetSesion()
      await fetchSesiones()
    } catch (err) {
      toast.error(err.message ?? 'No se pudo guardar la sesión')
    } finally {
      setGuardandoSesion(false)
    }
  }

  async function onEnviarSoporte(data) {
    if (!adminUserId) { toast.error('No se pudo encontrar el destinatario'); return }
    setEnviandoSoporte(true)
    try {
      const atData = {
        nombre: getValues('nombre'),
        apellido: getValues('apellido'),
        zona: getValues('zona'),
        matricula: getValues('matricula'),
        telefono: getValues('telefono'),
        whatsapp: getValues('whatsapp'),
        modalidad: getValues('modalidad'),
      }
      const contenido = `[SOPORTE AT]
Nombre: ${atData.nombre} ${atData.apellido}
Email: ${user.email}
Rol: Acompañante Terapéutico
Matrícula: ${atData.matricula || 'No especificada'}
Zona: ${atData.zona || 'No especificada'}
Modalidad: ${atData.modalidad || 'No especificada'}
Teléfono: ${atData.telefono || 'No especificado'}
WhatsApp: ${atData.whatsapp || 'No especificado'}
Obras sociales: ${obrasSelec.join(', ') || 'No especificadas'}
Especialidades: ${espSelec.join(', ') || 'No especificadas'}

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

  async function cambiarEstadoSesion(id, estado) {
    const { error } = await supabase.from('sessions').update({ estado }).eq('id', id)
    if (error) { toast.error('No se pudo actualizar'); return }
    toast.success('Estado actualizado')
    await fetchSesiones()
  }

  const ESTADO_COLORS = {
    confirmada: 'bg-green-50 text-green-700 border-green-100',
    pendiente:  'bg-yellow-50 text-yellow-700 border-yellow-100',
    cancelada:  'bg-red-50 text-red-500 border-red-100',
    realizada:  'bg-gray-100 text-gray-500 border-gray-200',
  }

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="min-h-screen bg-[#F5F0FA] flex">

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-[#2D1F45] z-30 flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>

        <div className="px-6 pt-8 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C9A8E8] to-[#7C5C9E] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
              {fotoUrlPreview
                ? <img src={fotoUrlPreview} alt="" className="w-full h-full object-cover" />
                : `${nombrePreview?.[0] ?? ''}${apellidoPreview?.[0] ?? ''}`}
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">{nombrePreview} {apellidoPreview}</p>
              <p className="text-white/40 text-xs">Acompañante Terapéutico</p>
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
              {item.id === 'mensajes' && mensajes.length > 0 && (
                <span className="text-[10px] font-bold bg-[#E8A87C] text-white px-1.5 py-0.5 rounded-full">{mensajes.length}</span>
              )}
              {item.id === 'agenda' && sesiones.length > 0 && (
                <span className="text-[10px] font-bold bg-[#C9A8E8] text-white px-1.5 py-0.5 rounded-full">{sesiones.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-white/20 text-xs">AcompañarTe · v0.1</p>
          {user?.email === 'candeladetapiab@gmail.com' && (
            <Link to="/admin" className="text-violet-400 text-xs mt-1 block hover:text-violet-300">⚙️ Admin</Link>
          )}
        </div>
      </aside>

      <main className="flex-1 min-w-0">

        <div className="lg:hidden flex items-center justify-between px-4 py-4 bg-[#2D1F45]">
          <button onClick={() => setSidebarOpen(true)} className="text-white text-xl">☰</button>
          <span className="text-white font-semibold text-sm">AcompañarTe</span>
          <div className="w-7" />
        </div>

        <div className="max-w-3xl mx-auto px-4 lg:px-8 py-8">

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#2D1F45]">{saludo}, {nombrePreview || profile?.nombre} 👋</h1>
            <p className="text-[#2D1F45]/40 text-sm mt-1">{NAV_ITEMS.find(n => n.id === tab)?.label}</p>
          </div>

          {tab === 'perfil' && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#F5F0FA] flex items-center justify-center text-[#7C5C9E] font-bold text-xl overflow-hidden flex-shrink-0">
                  {fotoUrlPreview
                    ? <img src={fotoUrlPreview} alt="" className="w-full h-full object-cover" />
                    : `${nombrePreview?.[0] ?? ''}${apellidoPreview?.[0] ?? ''}`}
                </div>
                <div>
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-[#7C5C9E] border border-[#C9A8E8] rounded-xl px-4 py-2 cursor-pointer hover:bg-[#F5F0FA] transition-colors">
                    {uploading ? 'Subiendo...' : 'Cambiar foto'}
                    <input type="file" accept="image/*" className="sr-only" onChange={uploadAvatar} disabled={uploading} />
                  </label>
                  <p className="text-xs text-[#2D1F45]/30 mt-1">JPG, PNG o WebP · Máx 2MB</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="text-xs font-semibold text-[#2D1F45]/50 mb-1.5 block">Nombre</label><input {...register('nombre', { required: true })} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#2D1F45] focus:outline-none focus:ring-2 focus:ring-[#C9A8E8]/40" /></div>
                  <div><label className="text-xs font-semibold text-[#2D1F45]/50 mb-1.5 block">Apellido</label><input {...register('apellido', { required: true })} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#2D1F45] focus:outline-none focus:ring-2 focus:ring-[#C9A8E8]/40" /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="text-xs font-semibold text-[#2D1F45]/50 mb-1.5 block">Matrícula</label><input {...register('matricula')} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#2D1F45] focus:outline-none focus:ring-2 focus:ring-[#C9A8E8]/40" /></div>
                  <div><label className="text-xs font-semibold text-[#2D1F45]/50 mb-1.5 block">Teléfono</label><input {...register('telefono')} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#2D1F45] focus:outline-none focus:ring-2 focus:ring-[#C9A8E8]/40" /></div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <div><label className="text-xs font-semibold text-[#2D1F45]/50 mb-1.5 block">Zona de trabajo</label><ComboInput listId="zona-dashboard-at" options={ZONAS_ALL} placeholder="Escribí o elegí: barrio, ciudad, provincia..." {...register('zona')} /></div>
                <div><label className="text-xs font-semibold text-[#2D1F45]/50 mb-1.5 block">Modalidad</label><select {...register('modalidad')} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#2D1F45] focus:outline-none focus:ring-2 focus:ring-[#C9A8E8]/40"><option value="Presencial">Presencial</option><option value="Virtual">Virtual</option><option value="Ambas">Ambas</option></select></div>
                <div><label className="text-xs font-semibold text-[#2D1F45]/50 mb-1.5 block">Precio</label><input {...register('precio')} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#2D1F45] focus:outline-none focus:ring-2 focus:ring-[#C9A8E8]/40" placeholder="Ej: $8000 o A convenir" /></div>
                <div><label className="text-xs font-semibold text-[#2D1F45]/50 mb-1.5 block">Descripción</label><textarea {...register('descripcion')} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#2D1F45] focus:outline-none focus:ring-2 focus:ring-[#C9A8E8]/40 resize-none" rows={4} placeholder="Contá tu experiencia, enfoque y lo que ofrecés..." /></div>
                <div><label className="text-xs font-semibold text-[#2D1F45]/50 mb-1.5 block">Experiencia</label><textarea {...register('experiencia')} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#2D1F45] focus:outline-none focus:ring-2 focus:ring-[#C9A8E8]/40 resize-none" rows={3} placeholder="Años de experiencia o trayectoria." /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="text-xs font-semibold text-[#2D1F45]/50 mb-1.5 block">WhatsApp</label><input {...register('whatsapp')} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#2D1F45] focus:outline-none focus:ring-2 focus:ring-[#C9A8E8]/40" placeholder="549..." /></div>
                  <div><label className="text-xs font-semibold text-[#2D1F45]/50 mb-1.5 block">Email de contacto</label><input type="email" {...register('email_contacto')} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#2D1F45] focus:outline-none focus:ring-2 focus:ring-[#C9A8E8]/40" /></div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="activo" {...register('activo')} className="rounded border-gray-300 text-[#7C5C9E]" />
                  <label htmlFor="activo" className="text-sm text-[#2D1F45]/60">Perfil activo (visible en búsquedas)</label>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <label className="text-xs font-semibold text-[#2D1F45]/50 mb-3 block">Obras sociales que atendés</label>
                <div className="flex flex-wrap gap-2">{OBRAS_SOCIALES.map(o => (<button key={o} type="button" onClick={() => toggleItem(obrasSelec, setObrasSelec, o)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${obrasSelec.includes(o) ? 'bg-[#7C5C9E] text-white border-[#7C5C9E]' : 'border-gray-200 text-[#2D1F45]/60 hover:border-[#C9A8E8]'}`}>{o}</button>))}</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <label className="text-xs font-semibold text-[#2D1F45]/50 mb-3 block">Especialidades</label>
                <div className="flex flex-wrap gap-2">{ESPECIALIDADES.map(e => (<button key={e} type="button" onClick={() => toggleItem(espSelec, setEspSelec, e)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${espSelec.includes(e) ? 'bg-[#E8A87C] text-white border-[#E8A87C]' : 'border-gray-200 text-[#2D1F45]/60 hover:border-[#E8A87C]'}`}>{e}</button>))}</div>
              </div>
              <div className="space-y-2">
                <button type="submit" disabled={isSubmitting} className="w-full bg-[#7C5C9E] hover:bg-[#6b4f8a] text-white font-semibold py-3.5 rounded-2xl transition-colors shadow-sm">{isSubmitting ? 'Guardando...' : 'Guardar perfil'}</button>
                {saveFeedback && (<p className={`text-sm font-medium ${saveFeedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{saveFeedback.message}</p>)}
              </div>
            </form>
          )}

          {tab === 'estadisticas' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Mensajes', value: stats.mensajes, icon: '💬', color: 'from-[#C9A8E8] to-[#7C5C9E]' },
                  { label: 'Reseñas', value: stats.resenas, icon: '⭐', color: 'from-[#E8A87C] to-[#c4824a]' },
                  { label: 'Calificación', value: stats.calificacion ?? '—', icon: '🏆', color: 'from-[#7C5C9E] to-[#2D1F45]' },
                ].map(s => (
                  <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white`}>
                    <div className="text-2xl mb-2">{s.icon}</div>
                    <div className="text-2xl font-bold">{s.value}</div>
                    <div className="text-white/70 text-xs mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm font-semibold text-[#2D1F45] mb-2">📈 Estadísticas detalladas</p>
                <p className="text-[#2D1F45]/40 text-sm">Las estadísticas de visitas al perfil y búsquedas donde aparecés estarán disponibles próximamente.</p>
              </div>
            </div>
          )}

          {tab === 'mensajes' && (
            <div className="space-y-3">
              {mensajes.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                  <div className="text-4xl mb-3">💬</div>
                  <p className="text-[#2D1F45]/50 font-medium text-sm">No tenés mensajes todavía.</p>
                  <p className="text-[#2D1F45]/35 text-xs mt-1">Cuando un paciente te contacte, aparecerá acá.</p>
                </div>
              ) : (
                mensajes.map(m => (
                  <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C9A8E8] to-[#7C5C9E] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">{(m._senderNombre?.[0] ?? 'P').toUpperCase()}</div>
                        <span className="font-semibold text-sm text-[#2D1F45]">{m._senderNombre}</span>
                      </div>
                      <span className="text-xs text-[#2D1F45]/30">{new Date(m.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <p className="text-[#2D1F45]/70 text-sm leading-relaxed whitespace-pre-line bg-gray-50 rounded-xl px-4 py-3">{m.content}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'agenda' && (
            <div className="space-y-4">
              <button onClick={() => setModalSesion(true)} className="w-full bg-[#7C5C9E] hover:bg-[#6b4f8a] text-white font-semibold py-3.5 rounded-2xl transition-colors shadow-sm">+ Nueva sesión</button>
              {sesiones.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                  <div className="text-4xl mb-3">📅</div>
                  <p className="text-[#2D1F45]/50 font-medium text-sm">No tenés sesiones agendadas.</p>
                  <p className="text-[#2D1F45]/35 text-xs mt-1">Agendá tu primera sesión con el botón de arriba.</p>
                </div>
              ) : (
                sesiones.map(s => (
                  <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm text-[#2D1F45]">{s.paciente_nombre}</p>
                        <p className="text-xs text-[#2D1F45]/40 mt-0.5">{new Date(s.fecha + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}{' · '}{s.hora?.slice(0, 5)} hs · {s.duracion_minutos} min · {s.modalidad}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ESTADO_COLORS[s.estado] ?? 'bg-gray-100 text-gray-500'}`}>{s.estado}</span>
                    </div>
                    {s.notas && <p className="text-xs text-[#2D1F45]/50 bg-gray-50 rounded-xl px-3 py-2 mt-2">{s.notas}</p>}
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {['confirmada', 'realizada', 'cancelada'].map(est => s.estado !== est && (
                        <button key={est} onClick={() => cambiarEstadoSesion(s.id, est)} className="text-xs text-[#2D1F45]/40 hover:text-[#7C5C9E] transition-colors border border-gray-100 rounded-lg px-2 py-1">Marcar como {est}</button>
                      ))}
                    </div>
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
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#2D1F45] focus:outline-none focus:ring-2 focus:ring-[#C9A8E8]/40" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#2D1F45]/50 mb-1.5 block">Mensaje</label>
                    <textarea {...regSoporte('mensaje', { required: true })}
                      placeholder="Contanos tu consulta o problema con el mayor detalle posible..."
                      rows={5}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#2D1F45] focus:outline-none focus:ring-2 focus:ring-[#C9A8E8]/40 resize-none" />
                  </div>
                  <div className="bg-[#F5F0FA] rounded-xl p-4 text-xs text-[#2D1F45]/50 space-y-1">
                    <p className="font-semibold text-[#2D1F45]/70 mb-2">Datos que se enviarán junto con tu mensaje:</p>
                    <p>👤 Nombre: {nombrePreview} {apellidoPreview}</p>
                    <p>📧 Email: {user?.email}</p>
                    <p>🩺 Rol: Acompañante Terapéutico</p>
                    <p>📋 Matrícula: {getValues('matricula') || 'No especificada'}</p>
                    <p>📍 Zona: {getValues('zona') || 'No especificada'}</p>
                    <p>📱 WhatsApp: {getValues('whatsapp') || 'No especificado'}</p>
                    {obrasSelec.length > 0 && <p>🏥 Obras sociales: {obrasSelec.join(', ')}</p>}
                    {espSelec.length > 0 && <p>🎯 Especialidades: {espSelec.join(', ')}</p>}
                  </div>
                  <button type="submit" disabled={enviandoSoporte}
                    className="w-full bg-[#7C5C9E] hover:bg-[#6b4f8a] text-white font-semibold py-3.5 rounded-2xl transition-colors shadow-sm">
                    {enviandoSoporte ? 'Enviando...' : 'Enviar mensaje'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {tab === 'marketplace'   && <ProximamenteCard label="Marketplace de recursos" />}
          {tab === 'facturacion'   && <ProximamenteCard label="Facturación" />}
          {tab === 'comunidad'     && <ProximamenteCard label="Comunidad de ATs" />}
          {tab === 'configuracion' && <ProximamenteCard label="Configuración" />}

        </div>
      </main>

      {modalSesion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-[#2D1F45] text-lg">Nueva sesión</h2>
              <button onClick={() => { setModalSesion(false); resetSesion() }} className="text-[#2D1F45]/30 hover:text-[#2D1F45] text-xl">✕</button>
            </div>
            <form onSubmit={handleSesion(onGuardarSesion)} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#2D1F45]/50 mb-1.5 block">Paciente</label>
                {pacientes.length > 0 ? (
                  <select {...regSesion('paciente_id')} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#2D1F45] focus:outline-none focus:ring-2 focus:ring-[#C9A8E8]/40">
                    <option value="">Seleccioná un paciente...</option>
                    {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    <option value="__otro__">Otro (escribir nombre)</option>
                  </select>
                ) : (
                  <input {...regSesion('paciente_nombre_libre')} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#2D1F45] focus:outline-none focus:ring-2 focus:ring-[#C9A8E8]/40" placeholder="Nombre del paciente" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-[#2D1F45]/50 mb-1.5 block">Fecha</label><input type="date" {...regSesion('fecha', { required: true })} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#2D1F45] focus:outline-none focus:ring-2 focus:ring-[#C9A8E8]/40" />{errSesion.fecha && <p className="text-xs text-red-500 mt-1">Requerido</p>}</div>
                <div><label className="text-xs font-semibold text-[#2D1F45]/50 mb-1.5 block">Hora</label><input type="time" {...regSesion('hora', { required: true })} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#2D1F45] focus:outline-none focus:ring-2 focus:ring-[#C9A8E8]/40" />{errSesion.hora && <p className="text-xs text-red-500 mt-1">Requerido</p>}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-[#2D1F45]/50 mb-1.5 block">Duración (min)</label><select {...regSesion('duracion_minutos')} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#2D1F45] focus:outline-none focus:ring-2 focus:ring-[#C9A8E8]/40"><option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>60 min</option><option value={90}>90 min</option><option value={120}>120 min</option></select></div>
                <div><label className="text-xs font-semibold text-[#2D1F45]/50 mb-1.5 block">Modalidad</label><select {...regSesion('modalidad')} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#2D1F45] focus:outline-none focus:ring-2 focus:ring-[#C9A8E8]/40"><option value="Presencial">Presencial</option><option value="Virtual">Virtual</option></select></div>
              </div>
              <div><label className="text-xs font-semibold text-[#2D1F45]/50 mb-1.5 block">Estado</label><select {...regSesion('estado')} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#2D1F45] focus:outline-none focus:ring-2 focus:ring-[#C9A8E8]/40"><option value="confirmada">Confirmada</option><option value="pendiente">Pendiente</option></select></div>
              <div><label className="text-xs font-semibold text-[#2D1F45]/50 mb-1.5 block">Notas (opcional)</label><textarea {...regSesion('notas')} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#2D1F45] focus:outline-none focus:ring-2 focus:ring-[#C9A8E8]/40 resize-none" rows={3} placeholder="Observaciones, dirección, link de videollamada..." /></div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setModalSesion(false); resetSesion() }} className="flex-1 border border-gray-200 text-[#2D1F45]/60 font-semibold py-3 rounded-2xl hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" disabled={guardandoSesion} className="flex-1 bg-[#7C5C9E] hover:bg-[#6b4f8a] text-white font-semibold py-3 rounded-2xl transition-colors">{guardandoSesion ? 'Guardando...' : 'Guardar sesión'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


