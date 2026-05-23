import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/useAuth'
import { ZONAS_ALL, OBRAS_SOCIALES, ESPECIALIDADES } from '../lib/constants'
import ComboInput from '../components/ComboInput'
import toast from 'react-hot-toast'

function ChipSelector({ items, selected, onToggle, colorActive, colorInactive }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => (
        <button
          key={item}
          type="button"
          onClick={() => onToggle(item)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${
            selected.includes(item) ? colorActive : colorInactive
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  )
}

function ChipCustomInput({ selected, onAdd, onRemove, options, placeholder, listId }) {
  const [text, setText] = useState('')

  function agregar() {
    const val = text.trim()
    if (val && !selected.includes(val)) {
      onAdd(val)
      setText('')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <ComboInput
          listId={listId}
          options={options.filter(o => !selected.includes(o))}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), agregar())}
          placeholder={placeholder}
          className="input-field flex-1"
        />
        <button
          type="button"
          onClick={agregar}
          className="btn-primary px-4 text-sm py-2"
        >
          + Agregar
        </button>
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map(item => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 text-xs px-3 py-1.5 rounded-full border border-primary-200"
            >
              {item}
              <button
                type="button"
                onClick={() => onRemove(item)}
                className="text-primary-400 hover:text-primary-700 leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function RegisterAT() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()
  const [obras, setObras] = useState([])
  const [especialidades, setEspecialidades] = useState([])

  function toggleEsp(item) {
    setEspecialidades(prev =>
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    )
  }

  async function onSubmit(data) {
    if (data.password !== data.confirmar) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    try {
      const result = await signUp({
        email:    data.email,
        password: data.password,
        nombre:   data.nombre,
        apellido: data.apellido,
        rol:      'at',
        atData: {
          zona:           data.zona,
          honorarios:     data.honorarios,
          obras_sociales: obras,
          especialidades,
        },
      })
      if (result?.session) {
        navigate('/home/at', { replace: true })
      } else {
        navigate('/confirmar-pendiente', { state: { email: data.email }, replace: true })
      }
    } catch (err) {
      toast.error(err.message)
    }
  }

  function onError() {
    toast.error('Completá todos los campos obligatorios antes de continuar.')
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 pb-16">
      <button onClick={() => navigate('/onboarding')} className="text-ink/50 text-sm mb-6 hover:text-ink transition-colors">
        ← Volver
      </button>

      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
          💜 Acompañante Terapéutico
        </div>
        <h1 className="text-2xl font-bold text-ink">Creá tu perfil profesional</h1>
        <p className="text-ink/50 text-sm mt-1">Completá tus datos para conectar con pacientes.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">

        {/* 1. Datos personales */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-ink">Datos personales</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nombre</label>
              <input type="text" className="input-field" placeholder="María"
                {...register('nombre', { required: 'Requerido' })} />
              {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre.message}</p>}
            </div>
            <div>
              <label className="label">Apellido</label>
              <input type="text" className="input-field" placeholder="González"
                {...register('apellido', { required: 'Requerido' })} />
              {errors.apellido && <p className="text-red-400 text-xs mt-1">{errors.apellido.message}</p>}
            </div>
          </div>

          <div>
            <label className="label">Email</label>
            <input type="email" className="input-field" placeholder="tu@email.com"
              {...register('email', { required: 'Requerido' })} />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label">Contraseña</label>
            <input type="password" className="input-field" placeholder="Mínimo 6 caracteres"
              {...register('password', { required: 'Requerida', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })} />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="label">Confirmar contraseña</label>
            <input type="password" className="input-field" placeholder="Repetí la contraseña"
              {...register('confirmar', { required: 'Requerida' })} />
            {errors.confirmar && <p className="text-red-400 text-xs mt-1">{errors.confirmar.message}</p>}
          </div>
        </div>

        {/* 2. Perfil profesional */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-ink">Perfil profesional</h2>

          <div>
            <label className="label">Zona de atención</label>
            <ComboInput
              listId="zona-at"
              options={ZONAS_ALL}
              placeholder="Escribí o elegí: barrio, ciudad, provincia..."
              {...register('zona')}
            />
            <p className="text-xs text-ink/40 mt-1">Podés escribir libremente si no encontrás tu zona.</p>
          </div>

          <div>
            <label className="label">Honorarios por sesión ($)</label>
            <input type="number" min="0" className="input-field" placeholder="Ej: 12000"
              {...register('honorarios')} />
          </div>
        </div>

        {/* 3. Obras sociales */}
        <div className="card">
          <h2 className="font-semibold text-ink mb-1">Obras sociales que atendés</h2>
          <p className="text-xs text-ink/45 mb-4">Elegí de la lista o escribí una que no esté.</p>
          <ChipCustomInput
            selected={obras}
            onAdd={val => setObras(prev => [...prev, val])}
            onRemove={val => setObras(prev => prev.filter(x => x !== val))}
            options={OBRAS_SOCIALES}
            placeholder="Buscar o escribir obra social..."
            listId="obras-at"
          />
        </div>

        {/* 4. Especialidades */}
        <div className="card">
          <h2 className="font-semibold text-ink mb-1">Especialidades</h2>
          <p className="text-xs text-ink/45 mb-4">Seleccioná tus áreas de experiencia.</p>
          <ChipSelector
            items={ESPECIALIDADES}
            selected={especialidades}
            onToggle={toggleEsp}
            colorActive="bg-accent-400 text-ink border-accent-400"
            colorInactive="border-gray-200 text-ink/65 hover:border-accent-300"
          />
        </div>

        <button type="submit" disabled={isSubmitting}
          className="btn-primary w-full py-3.5 text-base text-center">
          {isSubmitting ? 'Creando cuenta...' : 'Crear mi perfil profesional'}
        </button>

        <p className="text-sm text-center text-ink/50">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">Ingresá</Link>
        </p>
      </form>
    </div>
  )
}
