import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import { ZONAS_ALL, OBRAS_SOCIALES, ESPECIALIDADES } from '../lib/constants'
import ComboInput from '../components/ComboInput'
import toast from 'react-hot-toast'

export default function DashboardAT() {
  const { user, profile } = useAuth()
  const [mensajes, setMensajes] = useState([])
  const [sesiones, setSesiones] = useState([])
  const [pacientes, setPacientes] = useState([]) // pacientes que mandaron mensajes
  const [tab, setTab] = useState('perfil')
  const [uploading, setUploading] = useState(false)
  const [obrasSelec, setObrasSelec] = useState([])
  const [espSelec, setEspSelec] = useState([])
  const [saveFeedback, setSaveFeedback] = useState(null)
  const [modalSesion, setModalSesion] = useState(false)
  const [guardandoSesion, setGuardandoSesion] = useState(false)

  const { register, handleSubmit, setValue, getValues, watch, formState: { isSubmitting } } = useForm({
    defaultValues: {
      activo: true, nombre: '', apellido: '', zona: '', descripcion: '',
      modalidad: 'Presencial', precio: '', whatsapp: '', email_contacto: '',
      foto_url: '', matricula: '', telefono: '', experiencia: '',
    },
  })

  const { register: regSesion, handleSubmit: handleSesion, reset: resetSesion, formState: { errors: errSesion } } = useForm({
    defaultValues: {
      paciente_id: '',
      fecha: '',
      hora: '',
      duracion_minutos: 60,
      modalidad: 'Presencial',
      estado: 'confirmada',
      notas: '',
    }
  })

  const fotoUrlPreview = watch('foto_url')
  const nombrePreview = watch('nombre')
  const apellidoPreview = watch('apellido')

  useEffect(() => {
    if (!user) return
    fetchPerfilAT()
    fetchMensajes()
    fetchSesiones()
  }, [user])

  async function fetchPerfilAT() {
    const { data: atData, error } = await supabase
      .from('at_profiles').select('*').eq('id', user.id).maybeSingle()
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
    const { data, error } = await supabase
      .from('messages').select('*').eq('receiver_id', user.id)
      .order('created_at', { ascending: false })
    if (error) { toast.error('No se pudieron cargar tus mensajes'); return }

    const msgs = data ?? []
    if (msgs.length === 0) { setMensajes([]); return }

    const senderIds = [...new Set(msgs.map(m => m.sender_id).filter(Boolean))]
    const { data: perfiles } = await supabase
      .from('at_profiles').select('id, nombre, apellido').in('id', senderIds)

    const perfilesMap = {}
    perfiles?.forEach(p => { perfilesMap[p.id] = p })

    const msgsConNombre = msgs.map(m => ({
      ...m,
      _senderNombre: perfilesMap[m.sender_id]
        ? `${perfilesMap[m.sender_id].nombre ?? ''} ${perfilesMap[m.sender_id].apellido ?? ''}`.trim()
        : 'Paciente',
    }))

    setMensajes(msgsConNombre)

    // Armar lista de pacientes únicos para el dropdown
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
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('at_id', user.id)
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true })
    if (error) { toast.error('No se pudieron cargar las sesiones'); return }
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
    }
    const { error } = await supabase.from('at_profiles').upsert(atPayload, { onConflict: 'id' })
    if (error) {
      setSaveFeedback({ type: 'error', message: 'No se pudo guardar. Revisá los datos e intentá de nuevo.' })
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
      const payload = {
        at_id: user.id,
        paciente_id: data.paciente_id || null,
        paciente_nombre: paciente?.nombre ?? data.paciente_nombre_libre ?? 'Paciente',
        fecha: data.fecha,
        hora: data.hora,
        duracion_minutos: Number(data.duracion_minutos),
        modalidad: data.modalidad,
        estado: data.estado,
        notas: data.notas?.trim() ?? '',
      }
      const { error } = await supabase.from('sessions').insert(payload)
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

  async function cambiarEstadoSesion(id, estado) {
    const { error } = await supabase.from('sessions').update({ estado }).eq('id', id)
    if (error) { toast.error('No se pudo actualizar'); return }
    toast.success('Estado actualizado')
    await fetchSesiones()
  }

  const ESTADO_COLORS = {
    confirmada: 'bg-green-50 text-green-700 border-green-100',
    pendiente: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    cancelada: 'bg-red-50 text-red-500 border-red-100',
    realizada: 'bg-gray-100 text-gray-500 border-gray-200',
  }

  const tabs = [
    ['perfil', 'Mi perfil'],
    ['agenda', `Agenda (${sesiones.length})`],
    ['mensajes', `Mensajes (${mensajes.length})`],
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-ink mb-1">Mi perfil — AT</h1>
      <p className="text-ink/50 text-sm mb-7">{profile?.nombre} {profile?.apellido}</p>

      <div className="flex gap-2 mb-7 border-b border-gray-100">
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === id ? 'border-primary-600 text-primary-600' : 'border-transparent text-ink/50 hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB PERFIL ── */}
      {tab === 'perfil' && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Foto */}
          <div className="card flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl overflow-hidden flex-shrink-0">
              {fotoUrlPreview
                ? <img src={fotoUrlPreview} alt="" className="w-full h-full object-cover" />
                : `${nombrePreview?.[0] ?? ''}${apellidoPreview?.[0] ?? ''}`}
            </div>
            <div>
              <label className="btn-secondary text-sm cursor-pointer">
                {uploading ? 'Subiendo...' : 'Cambiar foto'}
                <input type="file" accept="image/*" className="sr-only" onChange={uploadAvatar} disabled={uploading} />
              </label>
              <p className="text-xs text-ink/40 mt-1">JPG, PNG o WebP · Máx 2MB</p>
            </div>
          </div>

          <div className="card space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="label">Nombre</label><input {...register('nombre', { required: true })} className="input-field" /></div>
              <div><label className="label">Apellido</label><input {...register('apellido', { required: true })} className="input-field" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="label">Matrícula</label><input {...register('matricula')} className="input-field" /></div>
              <div><label className="label">Teléfono</label><input {...register('telefono')} className="input-field" /></div>
            </div>
          </div>

          <div className="card space-y-4">
            <div>
              <label className="label">Zona de trabajo</label>
              <ComboInput listId="zona-dashboard-at" options={ZONAS_ALL} placeholder="Escribí o elegí: barrio, ciudad, provincia..." {...register('zona')} />
              <p className="text-xs text-ink/40 mt-1">Podés escribir libremente si no está en la lista.</p>
            </div>
            <div>
              <label className="label">Modalidad</label>
              <select {...register('modalidad')} className="input-field">
                <option value="Presencial">Presencial</option>
                <option value="Virtual">Virtual</option>
                <option value="Ambas">Ambas</option>
              </select>
            </div>
            <div><label className="label">Precio</label><input {...register('precio')} className="input-field" placeholder="Ej: $8000 o A convenir" /></div>
            <div><label className="label">Descripción</label><textarea {...register('descripcion')} className="input-field resize-none" rows={4} placeholder="Contá tu experiencia, enfoque y lo que ofrecés..." /></div>
            <div><label className="label">Experiencia</label><textarea {...register('experiencia')} className="input-field resize-none" rows={3} placeholder="Años de experiencia o trayectoria." /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="label">WhatsApp</label><input {...register('whatsapp')} className="input-field" placeholder="549..." /></div>
              <div><label className="label">Email de contacto</label><input type="email" {...register('email_contacto')} className="input-field" /></div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="activo" {...register('activo')} className="rounded border-gray-300 text-primary-600" />
              <label htmlFor="activo" className="text-sm text-ink/70">Perfil activo (visible en búsquedas)</label>
            </div>
          </div>

          <div className="card">
            <label className="label mb-3">Obras sociales que atendés</label>
            <div className="flex flex-wrap gap-2">
              {OBRAS_SOCIALES.map(o => (
                <button key={o} type="button" onClick={() => toggleItem(obrasSelec, setObrasSelec, o)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    obrasSelec.includes(o) ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-ink/70 hover:border-primary-300'
                  }`}>{o}</button>
              ))}
            </div>
          </div>

          <div className="card">
            <label className="label mb-3">Especialidades</label>
            <div className="flex flex-wrap gap-2">
              {ESPECIALIDADES.map(e => (
                <button key={e} type="button" onClick={() => toggleItem(espSelec, setEspSelec, e)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    espSelec.includes(e) ? 'bg-secondary-400 text-white border-secondary-400' : 'border-gray-200 text-ink/70 hover:border-secondary-300'
                  }`}>{e}</button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full text-center">
              {isSubmitting ? 'Guardando...' : 'Guardar perfil'}
            </button>
            {saveFeedback && (
              <p className={`text-sm font-medium ${saveFeedback.type === 'success' ? 'text-secondary-600' : 'text-red-600'}`}>
                {saveFeedback.message}
              </p>
            )}
          </div>
        </form>
      )}

      {/* ── TAB AGENDA ── */}
      {tab === 'agenda' && (
        <div className="space-y-4">
          <button
            onClick={() => setModalSesion(true)}
            className="btn-primary w-full text-center"
          >
            + Nueva sesión
          </button>

          {sesiones.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-ink/50 font-medium text-sm">No tenés sesiones agendadas.</p>
              <p className="text-ink/35 text-xs mt-1">Agendá tu primera sesión con el botón de arriba.</p>
            </div>
          ) : (
            sesiones.map(s => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm text-ink">{s.paciente_nombre}</p>
                    <p className="text-xs text-ink/40 mt-0.5">
                      {new Date(s.fecha + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      {' · '}{s.hora?.slice(0, 5)} hs · {s.duracion_minutos} min · {s.modalidad}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ESTADO_COLORS[s.estado] ?? 'bg-gray-100 text-gray-500'}`}>
                    {s.estado}
                  </span>
                </div>
                {s.notas && <p className="text-xs text-ink/50 bg-gray-50 rounded-xl px-3 py-2 mt-2">{s.notas}</p>}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {['confirmada', 'realizada', 'cancelada'].map(est => (
                    s.estado !== est && (
                      <button key={est} onClick={() => cambiarEstadoSesion(s.id, est)}
                        className="text-xs text-ink/40 hover:text-primary-600 transition-colors border border-gray-100 rounded-lg px-2 py-1">
                        Marcar como {est}
                      </button>
                    )
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TAB MENSAJES ── */}
      {tab === 'mensajes' && (
        <div className="space-y-3">
          {mensajes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-ink/50 font-medium text-sm">No tenés mensajes todavía.</p>
              <p className="text-ink/35 text-xs mt-1">Cuando un paciente te contacte, aparecerá acá.</p>
            </div>
          ) : (
            mensajes.map(m => (
              <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C9A8E8] to-[#7C5C9E] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {(m._senderNombre?.[0] ?? 'P').toUpperCase()}
                    </div>
                    <span className="font-semibold text-sm text-ink">{m._senderNombre}</span>
                  </div>
                  <span className="text-xs text-ink/30">
                    {new Date(m.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <p className="text-ink/70 text-sm leading-relaxed whitespace-pre-line bg-gray-50 rounded-xl px-4 py-3">
                  {m.content}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── MODAL NUEVA SESIÓN ── */}
      {modalSesion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-ink text-lg">Nueva sesión</h2>
              <button onClick={() => { setModalSesion(false); resetSesion() }}
                className="text-ink/30 hover:text-ink text-xl font-light">✕</button>
            </div>

            <form onSubmit={handleSesion(onGuardarSesion)} className="space-y-4">

              {/* Paciente */}
              <div>
                <label className="label">Paciente</label>
                {pacientes.length > 0 ? (
                  <select {...regSesion('paciente_id')} className="input-field">
                    <option value="">Seleccioná un paciente...</option>
                    {pacientes.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                    <option value="__otro__">Otro (escribir nombre)</option>
                  </select>
                ) : (
                  <input
                    {...regSesion('paciente_nombre_libre')}
                    className="input-field"
                    placeholder="Nombre del paciente"
                  />
                )}
              </div>

              {/* Fecha y hora */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Fecha</label>
                  <input type="date" {...regSesion('fecha', { required: true })}
                    className="input-field" />
                  {errSesion.fecha && <p className="text-xs text-red-500 mt-1">Requerido</p>}
                </div>
                <div>
                  <label className="label">Hora</label>
                  <input type="time" {...regSesion('hora', { required: true })}
                    className="input-field" />
                  {errSesion.hora && <p className="text-xs text-red-500 mt-1">Requerido</p>}
                </div>
              </div>

              {/* Duración y modalidad */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Duración (min)</label>
                  <select {...regSesion('duracion_minutos')} className="input-field">
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                    <option value={120}>120 min</option>
                  </select>
                </div>
                <div>
                  <label className="label">Modalidad</label>
                  <select {...regSesion('modalidad')} className="input-field">
                    <option value="Presencial">Presencial</option>
                    <option value="Virtual">Virtual</option>
                  </select>
                </div>
              </div>

              {/* Estado */}
              <div>
                <label className="label">Estado</label>
                <select {...regSesion('estado')} className="input-field">
                  <option value="confirmada">Confirmada</option>
                  <option value="pendiente">Pendiente</option>
                </select>
              </div>

              {/* Notas */}
              <div>
                <label className="label">Notas (opcional)</label>
                <textarea {...regSesion('notas')} className="input-field resize-none" rows={3}
                  placeholder="Observaciones, dirección, link de videollamada..." />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button"
                  onClick={() => { setModalSesion(false); resetSesion() }}
                  className="flex-1 btn-secondary text-center">
                  Cancelar
                </button>
                <button type="submit" disabled={guardandoSesion}
                  className="flex-1 btn-primary text-center">
                  {guardandoSesion ? 'Guardando...' : 'Guardar sesión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}