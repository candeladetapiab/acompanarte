import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import toast from 'react-hot-toast'

function Skeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 animate-pulse">
      <div className="h-7 w-44 bg-primary-100 rounded mb-6" />
      <div className="bg-white rounded-3xl border border-primary-100 p-6 mb-5">
        <div className="w-[120px] h-[120px] rounded-full bg-primary-100 mx-auto mb-4" />
        <div className="h-7 w-52 bg-primary-100 rounded mx-auto mb-3" />
        <div className="h-4 w-32 bg-primary-50 rounded mx-auto mb-4" />
        <div className="flex gap-2 justify-center">
          <div className="h-7 w-20 bg-accent-100 rounded-full" />
          <div className="h-7 w-20 bg-accent-100 rounded-full" />
        </div>
      </div>
    </div>
  )
}

function ReviewStars({ rating }) {
  return (
    <div className="text-secondary-400 text-base leading-none">
      {'★'.repeat(Math.round(rating || 0))}
      <span className="text-primary-200">{'★'.repeat(5 - Math.round(rating || 0))}</span>
    </div>
  )
}

function StarSelector({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={`text-2xl leading-none transition-transform hover:scale-110 ${
            star <= (hover || value) ? 'text-secondary-400' : 'text-primary-200'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function initials(name = '') {
  const parts = name.trim().split(' ').filter(Boolean)
  if (!parts.length) return 'AT'
  return parts.slice(0, 2).map(part => part[0].toUpperCase()).join('')
}

// Modal de mensajería
function ModalMensaje({ atNombre, onClose, onEnviar, enviando }) {
  const [texto, setTexto] = useState('')

  async function handleEnviar(e) {
    e.preventDefault()
    if (!texto.trim()) return
    await onEnviar(texto.trim())
    setTexto('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-ink text-lg">Enviar mensaje</h3>
            <p className="text-xs text-ink/45 mt-0.5">A {atNombre}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-ink/50 transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleEnviar} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-ink/50 mb-1.5 block">Tu mensaje</label>
            <textarea
              value={texto}
              onChange={e => setTexto(e.target.value)}
              rows={5}
              placeholder={`Hola ${atNombre}, me gustaría consultarte sobre...`}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-ink placeholder:text-ink/35 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300 transition-all resize-none"
              autoFocus
            />
            <p className="text-xs text-ink/35 mt-1">{texto.length}/500 caracteres</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-ink/60 font-medium py-3 rounded-2xl text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando || !texto.trim()}
              className="flex-1 bg-[#7C5C9E] hover:bg-[#6a4e8a] disabled:opacity-50 text-white font-semibold py-3 rounded-2xl text-sm transition-colors"
            >
              {enviando ? 'Enviando...' : 'Enviar 💬'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PerfilPublicoAT() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [atProfile, setAtProfile] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [ratingInput, setRatingInput] = useState(5)
  const [commentInput, setCommentInput] = useState('')
  const [sendingReview, setSendingReview] = useState(false)
  const [reviewThanks, setReviewThanks] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [enviandoMensaje, setEnviandoMensaje] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchData()
  }, [id])

  async function fetchData() {
    setLoading(true)
    setNotFound(false)
    const [{ data: atData, error: atError }, { data: reviewData, error: reviewError }] = await Promise.all([
      supabase.from('at_profiles').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('reviews')
        .select('id, at_id, patient_id, patient_name, rating, comment, created_at')
        .eq('at_id', id)
        .order('created_at', { ascending: false }),
    ])

    if (atError || !atData) {
      setLoading(false)
      setNotFound(true)
      return
    }

    setAtProfile(atData)
    setReviews(reviewError ? [] : (reviewData ?? []))
    setLoading(false)
  }

  async function enviarMensaje(texto) {
    if (!user) {
      navigate('/login')
      return
    }
    setEnviandoMensaje(true)
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: id,
      content: texto,
    })
    setEnviandoMensaje(false)
    if (error) {
      toast.error('No se pudo enviar el mensaje. Intentá de nuevo.')
      return
    }
    toast.success('¡Mensaje enviado! El AT te responderá pronto.')
    setModalAbierto(false)
  }

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0
    return reviews.reduce((acc, item) => acc + Number(item.rating || 0), 0) / reviews.length
  }, [reviews])

  const fullName = `${atProfile?.nombre ?? ''} ${atProfile?.apellido ?? ''}`.trim() || 'Acompañante Terapéutico'
  const cleanWhatsapp = (atProfile?.whatsapp ?? '').replace(/\D/g, '')
  const whatsappLink = cleanWhatsapp
    ? `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Hola ${fullName}, te encontré en AcompañarTe y me gustaría consultarte`)}`
    : null
  const isPaciente = Boolean(user && profile?.rol === 'paciente')
  const alreadyReviewed = Boolean(user && reviews.some(item => item.patient_id === user.id))

  async function submitReview(event) {
    event.preventDefault()
    if (!isPaciente || !user || alreadyReviewed) return
    setSendingReview(true)
    setReviewThanks('')
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        at_id: id,
        patient_id: user.id,
        patient_name: `${profile?.nombre ?? ''} ${profile?.apellido ?? ''}`.trim() || 'Paciente',
        rating: ratingInput,
        comment: commentInput.trim() || null,
      })
      .select('id, at_id, patient_id, patient_name, rating, comment, created_at')
      .single()

    if (error) {
      toast.error(error.message ?? 'No se pudo enviar tu reseña')
      setSendingReview(false)
      return
    }
    setReviews(prev => [data, ...prev])
    setCommentInput('')
    setRatingInput(5)
    setReviewThanks('¡Gracias por tu reseña!')
    toast.success('¡Gracias por tu reseña!')
    setSendingReview(false)
  }

  if (loading) return <Skeleton />

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl border border-primary-100 p-8">
          <p className="text-5xl mb-4">404</p>
          <h1 className="font-display text-3xl text-ink mb-2">Perfil no encontrado</h1>
          <p className="text-primary-700 text-sm mb-6">Este perfil de AT no existe o ya no está disponible.</p>
          <Link to="/buscar" className="btn-primary">Volver al buscador</Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Modal de mensaje */}
      {modalAbierto && (
        <ModalMensaje
          atNombre={fullName}
          onClose={() => setModalAbierto(false)}
          onEnviar={enviarMensaje}
          enviando={enviandoMensaje}
        />
      )}

      <div className="max-w-3xl mx-auto px-4 pb-28 pt-6">
        {/* Header del perfil */}
        <section className="bg-white rounded-3xl border border-primary-100 p-6 mb-5 text-center">
          <div className="w-[120px] h-[120px] mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-br from-primary-600 to-accent-400 flex items-center justify-center text-white text-3xl font-semibold">
            {atProfile?.foto_url || atProfile?.avatar_url
              ? <img src={atProfile.foto_url || atProfile.avatar_url} alt={fullName} className="w-full h-full object-cover" />
              : initials(fullName)}
          </div>
          <h1 className="font-display text-4xl text-ink leading-tight">{fullName}</h1>
          <p className="text-sm text-ink/45 mt-1">{atProfile?.matricula ? `Matrícula ${atProfile.matricula}` : 'Sin matrícula cargada'}</p>

          {atProfile?.especialidades?.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {atProfile.especialidades.map(item => (
                <span key={item} className="bg-accent-100 text-primary-700 rounded-full text-xs px-3 py-1.5">{item}</span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 text-sm">
            <div className="bg-cream rounded-xl py-2 px-3"><span className="text-ink/50">Zona:</span> <span className="text-ink">{atProfile?.zona || '—'}</span></div>
            <div className="bg-cream rounded-xl py-2 px-3"><span className="text-ink/50">Modalidad:</span> <span className="text-ink">{atProfile?.modalidad || '—'}</span></div>
            <div className="bg-cream rounded-xl py-2 px-3"><span className="text-ink/50">Precio:</span> <span className="text-ink">{atProfile?.precio || 'A convenir'}</span></div>
          </div>

          <div className="flex items-center justify-center gap-2 mt-4">
            <ReviewStars rating={averageRating} />
            <span className="text-sm text-ink/70">{averageRating ? averageRating.toFixed(1) : 'Sin calificaciones'}</span>
            <span className="text-sm text-ink/45">({reviews.length} reseñas)</span>
          </div>
        </section>

        {/* Sobre mí */}
        <section className="bg-white rounded-3xl border border-primary-100 p-6 mb-5">
          <h2 className="font-display text-3xl text-ink mb-3">Sobre mí</h2>
          <p className="text-ink/80 text-sm leading-relaxed whitespace-pre-line">
            {atProfile?.descripcion || 'Este AT todavía no cargó su presentación.'}
          </p>

          {atProfile?.obras_sociales?.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-ink/60 mb-2">Obras sociales</p>
              <div className="flex flex-wrap gap-2">
                {atProfile.obras_sociales.map(item => (
                  <span key={item} className="border border-primary-300 text-primary-700 rounded-full text-xs px-3 py-1.5">{item}</span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <p className="text-sm text-ink/60 mb-2">Modalidad de trabajo</p>
            <div className="flex flex-wrap gap-2 text-sm">
              {atProfile?.modalidad === 'Presencial' && <span className="bg-cream rounded-full px-3 py-1.5">🏠 Presencial</span>}
              {atProfile?.modalidad === 'Virtual' && <span className="bg-cream rounded-full px-3 py-1.5">💻 Virtual</span>}
              {atProfile?.modalidad === 'Ambas' && (
                <>
                  <span className="bg-cream rounded-full px-3 py-1.5">🏠 Presencial</span>
                  <span className="bg-cream rounded-full px-3 py-1.5">💻 Virtual</span>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Reseñas */}
        <section className="bg-white rounded-3xl border border-primary-100 p-6 mb-20">
          <h2 className="font-display text-3xl text-ink mb-3">Lo que dicen mis pacientes</h2>
          {isPaciente && (
            <div className="bg-cream border border-primary-100 rounded-2xl p-4 mb-4">
              {alreadyReviewed ? (
                <p className="text-sm text-primary-700 font-medium">Ya dejaste una reseña</p>
              ) : (
                <form onSubmit={submitReview} className="space-y-3">
                  <label className="text-sm text-ink/70">Tu calificación</label>
                  <StarSelector value={ratingInput} onChange={setRatingInput} />
                  <textarea
                    value={commentInput}
                    onChange={event => setCommentInput(event.target.value)}
                    rows={3}
                    placeholder="Contanos brevemente tu experiencia (opcional)"
                    className="w-full rounded-xl border border-primary-200 bg-white p-3 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                  <button type="submit" disabled={sendingReview} className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-2.5 px-4 text-sm font-medium">
                    {sendingReview ? 'Enviando...' : 'Enviar reseña'}
                  </button>
                  {reviewThanks && <p className="text-sm text-primary-700">{reviewThanks}</p>}
                </form>
              )}
            </div>
          )}
          {reviews.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-3">💬</div>
              <p className="text-ink/60">Todavía no hay reseñas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map(item => (
                <article key={item.id} className="bg-cream rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-200 text-primary-700 flex items-center justify-center text-sm font-semibold">
                      {initials(item.patient_name || 'P')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="font-medium text-sm text-ink">{item.patient_name || 'Paciente'}</p>
                        <p className="text-xs text-ink/45">
                          {new Date(item.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <ReviewStars rating={item.rating} />
                      <p className="text-sm text-ink/80 mt-2">{item.comment}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Barra fija de contacto */}
        <section className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-primary-100 p-3">
          <div className="max-w-3xl mx-auto">
            {isPaciente ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(true)}
                  className="bg-[#7C5C9E] hover:bg-[#6a4e8a] text-white rounded-xl py-3 text-sm font-semibold transition-colors"
                >
                  💬 Enviar mensaje
                </button>
                <a
                  href={whatsappLink ?? '#'}
                  target="_blank"
                  rel="noreferrer"
                  onClick={event => { if (!whatsappLink) event.preventDefault() }}
                  className="bg-[#25D366] hover:bg-[#1fb855] text-white rounded-xl py-3 text-sm font-semibold text-center transition-colors"
                >
                  WhatsApp
                </a>
              </div>
            ) : user ? (
              // Usuario logueado pero no es paciente (es AT viendo otro perfil)
              <p className="text-center text-xs text-ink/40 py-2">Estás viendo este perfil como AT</p>
            ) : (
              <Link
                to="/registro/paciente"
                className="block bg-[#7C5C9E] hover:bg-[#6a4e8a] text-white rounded-xl py-3 text-sm font-semibold text-center transition-colors"
              >
                Registrate para contactar
              </Link>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
