import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ZONAS_CABA, OBRAS_SOCIALES, ESPECIALIDADES } from '../lib/constants'

function StarRating({ value }) {
  return (
    <span className="text-secondary-400 text-sm">
      {'★'.repeat(Math.round(value))}{'☆'.repeat(5 - Math.round(value))}
      <span className="text-ink/40 ml-1 text-xs">({value?.toFixed(1) ?? '–'})</span>
    </span>
  )
}

export default function BuscarAT() {
  const navigate = useNavigate()
  const [ats, setAts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({ zona: '', obraSocial: '', especialidad: '', nombre: '' })

  useEffect(() => {
    fetchATs()
  }, [filtros])

  async function fetchATs() {
    setLoading(true)
    let query = supabase
      .from('at_profiles')
      .select('*')
      .eq('activo', true)

    if (filtros.zona) query = query.eq('zona', filtros.zona)
    if (filtros.obraSocial) query = query.contains('obras_sociales', [filtros.obraSocial])
    if (filtros.especialidad) query = query.contains('especialidades', [filtros.especialidad])

    const { data } = await query.order('created_at', { ascending: false })

    let resultado = data ?? []
    if (filtros.nombre) {
      const n = filtros.nombre.toLowerCase()
      resultado = resultado.filter(at =>
        `${at.nombre ?? ''} ${at.apellido ?? ''}`.toLowerCase().includes(n)
      )
    }
    setAts(resultado)
    setLoading(false)
  }

  function handleFiltro(e) {
    setFiltros(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function limpiarFiltros() {
    setFiltros({ zona: '', obraSocial: '', especialidad: '', nombre: '' })
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-ink mb-7">Buscar Acompañante Terapéutico</h1>

      {/* Filtros */}
      <div className="card mb-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="label">Nombre</label>
          <input
            name="nombre"
            value={filtros.nombre}
            onChange={handleFiltro}
            className="input-field"
            placeholder="Buscar por nombre..."
          />
        </div>
        <div>
          <label className="label">Zona</label>
          <select name="zona" value={filtros.zona} onChange={handleFiltro} className="input-field">
            <option value="">Todas las zonas</option>
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
        <button onClick={limpiarFiltros} className="btn-secondary text-sm sm:col-span-2 lg:col-span-4 w-auto self-end">
          Limpiar filtros
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      ) : ats.length === 0 ? (
        <div className="text-center py-16 text-ink/50">
          <div className="text-4xl mb-3">🔍</div>
          <p>No encontramos ATs con esos filtros. Intentá con otros criterios.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ats.map(at => (
            <article
              key={at.id}
              className="card hover:shadow-md hover:border-primary-100 transition-all flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                {at.foto_url || at.avatar_url ? (
                  <img src={at.foto_url || at.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg flex-shrink-0">
                    {at.nombre?.[0]}{at.apellido?.[0]}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-ink">{at.nombre} {at.apellido}</div>
                  <div className="text-xs text-ink/50">{at.zona}</div>
                </div>
              </div>
              {at.promedio_reseñas > 0 && <StarRating value={at.promedio_reseñas} />}
              {at.especialidades?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {at.especialidades.slice(0, 3).map(e => (
                    <span key={e} className="bg-secondary-50 text-secondary-600 text-xs px-2 py-0.5 rounded-full">{e}</span>
                  ))}
                </div>
              )}
              {at.precio && (
                <p className="text-sm text-primary-600 font-medium">{at.precio}</p>
              )}
              <button
                type="button"
                onClick={() => navigate(`/at/${at.id}`)}
                className="mt-1 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium py-2 px-4 rounded-xl self-start"
              >
                Ver perfil
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
