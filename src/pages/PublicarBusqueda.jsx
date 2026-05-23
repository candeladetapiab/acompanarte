import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import { ZONAS_CABA, OBRAS_SOCIALES, ESPECIALIDADES } from '../lib/constants'
import toast from 'react-hot-toast'

export default function PublicarBusqueda() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  async function onSubmit(data) {
    const { error } = await supabase.from('busquedas').insert({
      paciente_id: user.id,
      descripcion: data.descripcion,
      zona: data.zona,
      obra_social: data.obra_social,
      especialidad: data.especialidad,
      activa: true,
    })
    if (error) { toast.error(error.message); return }
    toast.success('¡Búsqueda publicada!')
    navigate('/dashboard/paciente')
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-ink mb-1">Publicar búsqueda de AT</h1>
      <p className="text-ink/50 text-sm mb-7">Los ATs registrados podrán ver tu búsqueda y contactarte.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
        <div>
          <label className="label">Descripción de la situación *</label>
          <textarea
            className="input-field resize-none"
            rows={5}
            placeholder="Contá brevemente la situación, la persona que necesita acompañamiento, el contexto, horarios aproximados, etc."
            {...register('descripcion', { required: 'Este campo es obligatorio', minLength: { value: 30, message: 'Mínimo 30 caracteres' } })}
          />
          {errors.descripcion && <p className="text-red-400 text-xs mt-1">{errors.descripcion.message}</p>}
        </div>

        <div>
          <label className="label">Zona</label>
          <select {...register('zona')} className="input-field">
            <option value="">Seleccioná una zona</option>
            {ZONAS_CABA.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Obra social</label>
          <select {...register('obra_social')} className="input-field" defaultValue={profile?.obra_social ?? ''}>
            <option value="">Sin cobertura / No sé</option>
            {OBRAS_SOCIALES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Especialidad buscada</label>
          <select {...register('especialidad')} className="input-field">
            <option value="">Sin preferencia</option>
            {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 text-center">
            {isSubmitting ? 'Publicando...' : 'Publicar búsqueda'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
