import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import { OBRAS_SOCIALES, ZONAS_ALL } from '../lib/constants'
import ComboInput from '../components/ComboInput'
import MensajesTab from '../components/MensajesTab'
import toast from 'react-hot-toast'

export default function DashboardPaciente() {
  const { user, profile } = useAuth()
  const [busquedas, setBusquedas] = useState([])
  const [tab, setTab] = useState('perfil')
  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm()

  useEffect(() => {
    if (!user) return
    fetchDatos()
    setValue('nombre', profile?.nombre ?? '')
    setValue('apellido', profile?.apellido ?? '')
    setValue('obra_social', profile?.obra_social ?? '')
    setValue('zona', profile?.zona ?? '')
    setValue('telefono', profile?.telefono ?? '')
  }, [user, profile])

  async function fetchDatos() {
    const { data: b } = await supabase
      .from('busquedas').select('*').eq('paciente_id', user.id).order('created_at', { ascending: false })
    setBusquedas(b ?? [])
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

  async function cerrarBusqueda(id) {
    await supabase.from('busquedas').update({ activa: false }).eq('id', id)
    fetchDatos()
    toast.success('Búsqueda cerrada')
  }

  const tabs = [
    { id: 'perfil', label: 'Mi perfil', icon: '👤' },
    { id: 'busquedas', label: `Búsquedas (${busquedas.length})`, icon: '📢' },
    { id: 'mensajes', label: 'Mensajes', icon: '💬' },
  ]

  return (
    <div className="min-h-screen bg-[#F5F0FA]">

      {/* Header */}
      <div className="bg-gradient-to-br from-[#2D1F45] via-[#6b3a2d] to-[#E8A87C] px-4 pt-8 pb-16">
        <div className="max-w-2xl mx-auto">
          <p className="text-white/50 text-sm mb-1">Mi cuenta</p>
          <h1 className="text-white text-2xl font-bold">{profile?.nombre} {profile?.apellido}</h1>
          <p className="text-white/40 text-xs mt-1">{user?.email}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6 pb-12">

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5 overflow-hidden">
          <div className="flex">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3.5 text-xs font-medium transition-all border-b-2 ${
                  tab === t.id
                    ? 'border-[#E8A87C] text-[#c4824a] bg-orange-50/50'
                    : 'border-transparent text-ink/40 hover:text-ink/60'
                }`}
              >
                <span className="text-lg">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab: Perfil */}
        {tab === 'perfil' && (
          <form onSubmit={handleSubmit(onSubmitPerfil)} className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h2 className="font-bold text-sm uppercase tracking-wide text-ink/40">Datos personales</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-ink/50 mb-1.5 block">Nombre</label>
                  <input
                    {...register('nombre', { required: true })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-[#E8A87C]/40 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink/50 mb-1.5 block">Apellido</label>
                  <input
                    {...register('apellido', { required: true })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-[#E8A87C]/40 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-ink/50 mb-1.5 block">Teléfono</label>
                <input
                  {...register('telefono')}
                  placeholder="Ej: 1134567890"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-[#E8A87C]/40 transition-all"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h2 className="font-bold text-sm uppercase tracking-wide text-ink/40">Cobertura y zona</h2>
              <div>
                <label className="text-xs font-semibold text-ink/50 mb-1.5 block">Obra social</label>
                <ComboInput
                  listId="obra-dashboard-paciente"
                  options={OBRAS_SOCIALES}
                  placeholder="Escribí o elegí tu obra social..."
                  {...register('obra_social')}
                />
                <p className="text-xs text-ink/35 mt-1">Podés escribir libremente si no está en la lista.</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-ink/50 mb-1.5 block">Zona</label>
                <ComboInput
                  listId="zona-dashboard-paciente"
                  options={ZONAS_ALL}
                  placeholder="Escribí o elegí tu zona..."
                  {...register('zona')}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#E8A87C] hover:bg-[#d4956a] text-white font-semibold py-3.5 rounded-2xl transition-colors shadow-sm"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        )}

        {/* Tab: Búsquedas */}
        {tab === 'busquedas' && (
          <div className="space-y-4">
            <Link
              to="/publicar-busqueda"
              className="flex items-center justify-center gap-2 w-full bg-[#E8A87C] hover:bg-[#d4956a] text-white font-semibold py-3.5 rounded-2xl transition-colors shadow-sm"
            >
              <span>📢</span> Nueva búsqueda
            </Link>
            {busquedas.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-12 px-6">
                <div className="text-4xl mb-3">📭</div>
                <p className="font-semibold text-ink/60 text-sm">No publicaste búsquedas todavía</p>
                <p className="text-ink/35 text-xs mt-1">Publicá una búsqueda para que los ATs te encuentren.</p>
              </div>
            ) : (
              busquedas.map(b => (
                <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      b.activa ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-100 text-ink/40'
                    }`}>
                      {b.activa ? '● Activa' : 'Cerrada'}
                    </span>
                    <span className="text-xs text-ink/30">
                      {new Date(b.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                    </span>
                  </div>
                  <p className="text-sm text-ink/70 mb-3 leading-relaxed">{b.descripcion}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-ink/50">
                    {b.zona && <span className="bg-gray-50 px-2 py-1 rounded-lg">📍 {b.zona}</span>}
                    {b.obra_social && <span className="bg-gray-50 px-2 py-1 rounded-lg">🏥 {b.obra_social}</span>}
                    {b.especialidad && <span className="bg-gray-50 px-2 py-1 rounded-lg">🎯 {b.especialidad}</span>}
                  </div>
                  {b.activa && (
                    <button
                      onClick={() => cerrarBusqueda(b.id)}
                      className="mt-4 text-xs text-ink/40 hover:text-red-500 transition-colors font-medium"
                    >
                      Cerrar búsqueda ×
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Mensajes */}
        {tab === 'mensajes' && <MensajesTab />}

      </div>
    </div>
  )
}
