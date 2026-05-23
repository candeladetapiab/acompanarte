import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import toast from 'react-hot-toast'
import { PROVINCIAS } from '../lib/constants'

const ESPECIALIDADES_DISPONIBLES = [
  'Salud mental',
  'Infancia y adolescencia',
  'Adultos mayores',
  'Adicciones',
  'Discapacidad',
  'Trastornos del neurodesarrollo',
  'Duelo',
  'Crisis vitales',
  'Problemáticas de género',
]

const MODALIDADES = ['Presencial', 'Virtual', 'Ambas']

function StarRating({ value }) {
  return (
    <div className="flex gap-1 text-lg">
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} className={star <= value ? 'text-secondary-400' : 'text-primary-100'}>★</span>
      ))}
    </div>
  )
}

function toInitials(name = '') {
  const parts = name.trim().split(' ').filter(Boolean)
  if (!parts.length) return 'P'
  return parts.slice(0, 2).map(p => p[0].toUpperCase()).join('')
}

async function loadATProfile(targetAtId) {
  const { data, error } = await supabase
    .from('at_profiles')
    .select('*')
    .eq('id', targetAtId)
    .maybeSingle()

  if (error) throw error
  return data
}

async function loadReviews(targetAtId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, at_id, patient_name, patient_avatar, rating, comment, created_at')
    .eq('at_id', targetAtId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export default function PerfilAT() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('perfil')

  const [form, setForm] = useState({
    fullName: '',
    bio: '',
    especialidades: [],
    modalidad: 'Presencial',
    zona: '',
    precio: '',
    aConvenir: false,
    whatsapp: '',
    contactEmail: '',
  })

  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')

  const perfilRef = useRef(null)
  const resenasRef = useRef(null)
  const contactoRef = useRef(null)

  const targetAtId = id || user?.id
  const canEdit = Boolean(user && targetAtId && user.id === targetAtId && profile?.rol === 'at')

  useEffect(() => {
    if (!targetAtId) return
    fetchAllData()
  }, [targetAtId])

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  async function fetchAllData() {
    setLoading(true)
    try {
      const [profileResponse, reviewsData] = await Promise.all([
        loadATProfile(targetAtId),
        loadReviews(targetAtId),
      ])
      setReviews(reviewsData)
      const initialFullName = profileResponse?.nombre ?? ''
      setForm({
        fullName: initialFullName,
        bio: profileResponse?.descripcion ?? '',
        especialidades: profileResponse?.especialidades ?? [],
        modalidad: profileResponse?.modalidad ?? 'Presencial',
        zona: profileResponse?.zona ?? '',
        precio: profileResponse?.precio ?? '',
        aConvenir: (profileResponse?.precio ?? '').toLowerCase?.() === 'a convenir',
        whatsapp: profileResponse?.whatsapp ?? '',
        contactEmail: profileResponse?.email_contacto ?? '',
      })
      setAvatarUrl(profileResponse?.foto_url ?? '')
    } catch (error) {
      toast.error(error.message ?? 'No se pudo cargar el perfil')
    } finally {
      setLoading(false)
    }
  }

  function setField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleEspecialidad(value) {
    setForm(prev => {
      const exists = prev.especialidades.includes(value)
      if (exists) {
        return { ...prev, especialidades: prev.especialidades.filter(item => item !== value) }
      }
      if (prev.especialidades.length >= 3) {
        toast.error('Podés seleccionar hasta 3 especialidades')
        return prev
      }
      return { ...prev, especialidades: [...prev.especialidades, value] }
    })
  }

  function goToSection(sectionId) {
    const map = { perfil: perfilRef, reseñas: resenasRef, contacto: contactoRef }
    const ref = map[sectionId]
    setActiveTab(sectionId)
    ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function uploadAvatarIfNeeded() {
    if (!avatarFile || !user) return avatarUrl || null

    const ext = avatarFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${user.id}/avatar-perfil-at-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true })
    if (uploadError) throw uploadError

    const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path)
    return publicData.publicUrl
  }

  async function onAvatarChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Seleccioná una imagen válida')
      return
    }

    if (avatarPreview) URL.revokeObjectURL(avatarPreview)

    setUploading(true)
    const preview = URL.createObjectURL(file)
    setAvatarFile(file)
    setAvatarPreview(preview)
    setUploading(false)
  }

  async function onSaveProfile() {
    if (!canEdit || !user) return
    if (!form.fullName.trim()) {
      toast.error('Ingresá tu nombre completo')
      return
    }

    setSaving(true)
    try {
      const nextAvatarUrl = await uploadAvatarIfNeeded()
      const precioNormalizado = form.aConvenir ? 'A convenir' : `$${form.precio || '0'}`

      const atPayload = {
        id: user.id,
        nombre: form.fullName.trim() || null,
        descripcion: form.bio.trim() || null,
        especialidades: form.especialidades,
        modalidad: form.modalidad,
        zona: form.zona || null,
        precio: precioNormalizado,
        whatsapp: form.whatsapp || null,
        email_contacto: form.contactEmail || null,
        foto_url: nextAvatarUrl,
        activo: true,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('at_profiles').upsert(atPayload, { onConflict: 'id' })
      if (error) throw error

      toast.success('Perfil guardado')
      await fetchAllData()
      setAvatarFile(null)
    } catch (error) {
      toast.error(error.message ?? 'No se pudo guardar el perfil')
    } finally {
      setSaving(false)
    }
  }

  const promedio = reviews.length
    ? reviews.reduce((acc, item) => acc + Number(item.rating || 0), 0) / reviews.length
    : 0
  const previewName = form.fullName.trim() || 'Tu nombre'
  const previewAvatar = avatarPreview || avatarUrl
  const formattedWhatsapp = form.whatsapp.replace(/\D/g, '')
  const whatsappHref = formattedWhatsapp
    ? `https://wa.me/${formattedWhatsapp}?text=${encodeURIComponent(`Hola ${previewName}, te encontré en AcompañarTe y me gustaría consultarte`)}`
    : null

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pb-16 text-ink">
      <button onClick={() => navigate(-1)} className="text-sm text-primary-700 hover:text-ink mt-6 mb-4">
        ← Volver
      </button>

      <header className="mb-5">
        <h1 className="text-3xl text-ink font-display">Perfil completo AT</h1>
        <p className="text-sm text-primary-700 mt-1">Gestioná tu perfil, reseñas y contacto en un solo lugar.</p>
      </header>

      <nav className="sticky top-2 z-10 bg-cream/95 backdrop-blur rounded-2xl border border-primary-100 p-2 mb-6">
        <div className="grid grid-cols-3 gap-2 text-sm">
          {[
            ['perfil', 'Editar perfil'],
            ['reseñas', 'Reseñas'],
            ['contacto', 'Contacto'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => goToSection(key)}
              className={`rounded-xl px-3 py-2 transition-colors ${
                activeTab === key ? 'bg-primary-600 text-white' : 'text-primary-700 hover:bg-primary-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      <section ref={perfilRef} id="perfil" className="bg-white border border-primary-100 rounded-3xl p-5 mb-6">
        <h2 className="text-2xl font-display mb-4">Editar perfil</h2>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary-200 bg-primary-50 flex items-center justify-center text-primary-700 font-semibold">
                {previewAvatar ? (
                  <img src={previewAvatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  toInitials(previewName)
                )}
              </div>
              <label className="text-sm text-primary-700 cursor-pointer underline underline-offset-4">
                {uploading ? 'Subiendo...' : 'Cambiar foto'}
                <input type="file" accept="image/*" className="sr-only" onChange={onAvatarChange} />
              </label>
            </div>

            <div>
              <label className="text-sm text-primary-700">Nombre completo</label>
              <input
                value={form.fullName}
                onChange={e => setField('fullName', e.target.value)}
                className="w-full bg-transparent border-0 border-b border-primary-200 focus:border-primary-600 focus:ring-0 px-0 py-2 outline-none"
                placeholder="Ej: Ana García"
                disabled={!canEdit}
              />
            </div>

            <div>
              <label className="text-sm text-primary-700">Presentación / bio</label>
              <textarea
                value={form.bio}
                onChange={e => setField('bio', e.target.value)}
                className="w-full bg-transparent border-0 border-b border-primary-200 focus:border-primary-600 focus:ring-0 px-0 py-2 outline-none resize-none"
                rows={4}
                placeholder="Contá tu enfoque terapéutico y experiencia."
                disabled={!canEdit}
              />
            </div>

            <div>
              <label className="text-sm text-primary-700">Especialidades (máximo 3)</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ESPECIALIDADES_DISPONIBLES.map(item => {
                  const selected = form.especialidades.includes(item)
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => canEdit && toggleEspecialidad(item)}
                      className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${
                        selected ? 'bg-accent-400 border-accent-400 text-ink' : 'border-primary-200 text-primary-700'
                      } ${canEdit ? 'hover:border-primary-400' : 'opacity-70 cursor-default'}`}
                    >
                      {item}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="text-sm text-primary-700 mb-2 block">Modalidad</label>
              <div className="flex flex-wrap gap-2">
                {MODALIDADES.map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => canEdit && setField('modalidad', item)}
                    className={`px-4 py-2 rounded-full border text-sm ${
                      form.modalidad === item
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : 'border-primary-200 text-primary-700'
                    } ${canEdit ? '' : 'opacity-70 cursor-default'}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-primary-700">Zona de trabajo</label>
              <select
                value={form.zona}
                onChange={e => setField('zona', e.target.value)}
                className="w-full bg-transparent border-0 border-b border-primary-200 focus:border-primary-600 px-0 py-2 outline-none"
                disabled={!canEdit}
              >
                <option value="">Seleccioná una provincia</option>
                {PROVINCIAS.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm text-primary-700 block">Precio por sesión</label>
              <div className="flex items-center gap-3 mt-2">
                {!form.aConvenir && (
                  <div className="flex items-center w-full border-b border-primary-200">
                    <span className="text-primary-700 mr-2">$</span>
                    <input
                      type="number"
                      value={form.precio}
                      onChange={e => setField('precio', e.target.value)}
                      className="w-full bg-transparent border-none px-0 py-2 outline-none"
                      placeholder="0"
                      disabled={!canEdit}
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => canEdit && setField('aConvenir', !form.aConvenir)}
                  className={`px-4 py-2 rounded-full border text-sm whitespace-nowrap ${
                    form.aConvenir ? 'bg-secondary-400 border-secondary-400 text-ink' : 'border-primary-200 text-primary-700'
                  } ${canEdit ? '' : 'opacity-70 cursor-default'}`}
                >
                  A convenir
                </button>
              </div>
            </div>
          </div>

          <aside className="bg-cream border border-primary-100 rounded-2xl p-4 h-fit">
            <h3 className="font-display text-xl mb-3">Vista previa</h3>
            <div className="bg-white rounded-2xl p-4 border border-primary-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-primary-50 flex items-center justify-center text-primary-700 font-semibold">
                  {previewAvatar ? <img src={previewAvatar} alt="" className="w-full h-full object-cover" /> : toInitials(previewName)}
                </div>
                <div>
                  <p className="font-semibold">{previewName}</p>
                  <p className="text-xs text-primary-700">{form.modalidad}</p>
                </div>
              </div>
              <p className="text-sm text-ink/80 mb-3">{form.bio || 'Tu presentación aparecerá aquí.'}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {form.especialidades.length > 0
                  ? form.especialidades.map(item => <span key={item} className="text-xs bg-accent-100 text-primary-700 rounded-full px-2 py-1">{item}</span>)
                  : <span className="text-xs text-primary-700">Sin especialidades seleccionadas</span>}
              </div>
              <div className="text-sm text-primary-700">
                {form.aConvenir ? 'Precio: A convenir' : `Precio: $${form.precio || '0'}`}
              </div>
            </div>
          </aside>
        </div>

        {canEdit && (
          <button onClick={onSaveProfile} disabled={saving} className="btn-primary mt-6">
            {saving ? 'Guardando...' : 'Guardar perfil'}
          </button>
        )}
      </section>

      <section ref={resenasRef} id="reseñas" className="bg-white border border-primary-100 rounded-3xl p-5 mb-6">
        <h2 className="text-2xl font-display mb-1">Reseñas</h2>
        <p className="text-primary-700 text-sm mb-5">
          {reviews.length > 0 ? `★ ${promedio.toFixed(1)} · ${reviews.length} reseñas` : 'Sin reseñas todavía'}
        </p>

        {reviews.length === 0 ? (
          <div className="bg-cream border border-primary-100 rounded-2xl p-5 text-primary-700 text-sm">
            Todavía no tenés reseñas. ¡Aparecerán aquí cuando tus pacientes te califiquen!
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(item => (
              <article key={item.id} className="border-b border-primary-100 pb-4 last:border-b-0">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
                    {item.patient_avatar ? <img src={item.patient_avatar} alt="" className="w-full h-full object-cover" /> : toInitials(item.patient_name)}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-sm">{item.patient_name}</p>
                      <p className="text-xs text-primary-700">
                        {new Date(item.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <StarRating value={Number(item.rating || 0)} />
                    <p className="text-sm text-ink/80 mt-2">{item.comment}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section ref={contactoRef} id="contacto" className="bg-white border border-primary-100 rounded-3xl p-5">
        <h2 className="text-2xl font-display mb-4">Contacto</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-primary-700">Número de WhatsApp</label>
            <input
              value={form.whatsapp}
              onChange={e => setField('whatsapp', e.target.value)}
              placeholder="Ej: 5491122334455"
              className="w-full bg-transparent border-0 border-b border-primary-200 focus:border-primary-600 px-0 py-2 outline-none"
              disabled={!canEdit}
            />
          </div>

          <div>
            <label className="text-sm text-primary-700">Email de contacto (opcional)</label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={e => setField('contactEmail', e.target.value)}
              placeholder="contacto@ejemplo.com"
              className="w-full bg-transparent border-0 border-b border-primary-200 focus:border-primary-600 px-0 py-2 outline-none"
              disabled={!canEdit}
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={whatsappHref ?? '#'}
              target="_blank"
              rel="noreferrer"
              onClick={e => {
                if (!whatsappHref) {
                  e.preventDefault()
                  toast.error('Primero cargá un número de WhatsApp')
                }
              }}
              className="bg-[#25D366] text-white px-5 py-2.5 rounded-xl text-sm font-medium"
            >
              WhatsApp
            </a>

            <button
              type="button"
              onClick={() => navigate('/dashboard/paciente')}
              className="px-5 py-2.5 rounded-xl text-sm font-medium border border-primary-200 text-primary-700 hover:bg-primary-50"
            >
              Enviar mensaje interno
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
