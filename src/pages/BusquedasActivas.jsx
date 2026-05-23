import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import { ZONAS_CABA, OBRAS_SOCIALES, ESPECIALIDADES } from '../lib/constants'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'

export default function BusquedasActivas() {
  const { user, profile } = useAuth()
  const [busquedas, setBusquedas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({ zona: '', obraSocial: '', especialidad: '' })
  const [contactando, setContactando] = useState(null)
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

  useEffect(() => {
    fetchBusquedas()
  }, [filtros])

  async function fetchBusquedas() {
    setLoading(true)
    let query = supabase
      .from('busquedas')
      .select('*')
      .eq('activa', true)

    if (filtros.zona) query = query.eq('zona', filtros.zona)
    if (filtros.obraSocial) query = query.eq('obra_social', filtros.obraSocial)
    if (filtros.especialidad) query = query.eq('especialidad', filtros.especialidad)

    const { data } = await query.order('created_at', { ascending: false })
    setBusquedas(data ?? [])
    setLoading(false)
  }

  async function enviarMensaje(data) {
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,       // ← corregido
      receiver_id: contactando, // ← corregido
      content: data.contenido,  // ← corregido
    })
    if (error) { toast.error('Error al enviar'); return }
    toast.success('Mensaje enviado al paciente/familia')
    reset()
    setContactando(null)
  }

  function handleFiltro(e) {
    setFiltros(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-ink mb-2">Búsquedas activas</h1>
      <p className="text-ink/50 text-sm mb-7">Familias y pacientes que están buscando un AT ahora.</p>

      {/* Filtros */}
      <div className="card mb-7 grid sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Zona</label>
          <select name="zona" value={filtros.zona} onChange={handleFiltro} className="input-field">
            <option value="">Todas</option>
            {ZONAS_CABA.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Obra social</label>
          <select name="obraSocial" value={filtros.obraSocial} onChange={handleFiltro} className="input-field">
            <option value="">Todas</option>
            {OBRAS_SOCIALES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Especialidad</label>
          <select name="especialidad" value={filtros.especialidad} onChange={handleFiltro} className="input-field">
            <option value="">Todas</option>
            {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      ) : busquedas.length === 0 ? (
        <div className="text-center py-16 text-ink/50">
          <div className="text-4xl mb-3">📭</div>
          <p>No hay búsquedas activas con esos filtros.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {busquedas.map(b => (
            <div key={b.id} className="card">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-sm text-ink">{b.paciente_id ?? 'Paciente'}</span>
                <span className="text-xs text-ink/40">{new Date(b.created_at).toLocaleDateString('es-AR')}</span>
              </div>
              <p className="text-ink/70 text-sm mb-3 leading-relaxed">{b.descripcion}</p>
              <div className="flex flex-wrap gap-3 text-xs text-ink/50">
                {b.zona && <span>📍 {b.zona}</span>}
                {b.obra_social && <span>🏥 {b.obra_social}</span>}
                {b.especialidad && <span>🎯 {b.especialidad}</span>}
              </div>

              {user && profile?.rol === 'at' && (
                <>
                  {contactando === b.paciente_id ? (
                    <form onSubmit={handleSubmit(enviarMensaje)} className="mt-4 space-y-2">
                      <textarea
                        className="input-field resize-none"
                        rows={3}
                        placeholder="Presentate y contá tu disponibilidad..."
                        {...register('contenido', { required: true })}
                      />
                      <div className="flex gap-2">
                        <button type="submit" disabled={isSubmitting} className="btn-primary text-sm">
                          {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
                        </button>
                        <button type="button" onClick={() => setContactando(null)} className="btn-secondary text-sm">
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setContactando(b.paciente_id)}
                      className="btn-primary text-sm mt-4"
                    >
                      Contactar
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
