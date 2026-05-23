import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/useAuth'
import { ZONAS_ALL, OBRAS_SOCIALES } from '../lib/constants'
import ComboInput from '../components/ComboInput'
import toast from 'react-hot-toast'

export default function RegisterPaciente() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  async function onSubmit(data) {
    if (data.password !== data.confirmar) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    try {
      await signUp({
        email:    data.email,
        password: data.password,
        nombre:   data.nombre,
        apellido: data.apellido,
        rol:      'paciente',
      })
      navigate('/confirmar-pendiente', { state: { email: data.email }, replace: true })
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8 pb-16">
      <button onClick={() => navigate('/onboarding')} className="text-ink/50 text-sm mb-6 hover:text-ink transition-colors">
        ← Volver
      </button>

      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-secondary-100 text-secondary-600 text-xs font-semibold px-3 py-1 rounded-full mb-3">
          🧡 Paciente / Familia
        </div>
        <h1 className="text-2xl font-bold text-ink">Creá tu cuenta</h1>
        <p className="text-ink/50 text-sm mt-1">Encontrá el AT ideal para vos o tu familia.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Datos personales */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-ink">Datos personales</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nombre</label>
              <input type="text" className="input-field" placeholder="Juan"
                {...register('nombre', { required: 'Requerido' })} />
              {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre.message}</p>}
            </div>
            <div>
              <label className="label">Apellido</label>
              <input type="text" className="input-field" placeholder="Pérez"
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
          </div>
        </div>

        {/* Cobertura y zona */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-ink">Tu cobertura médica</h2>
          <p className="text-xs text-ink/45 -mt-2">Nos ayuda a mostrarte ATs compatibles con tu cobertura.</p>

          <div>
            <label className="label">Obra social</label>
            <ComboInput
              listId="obra-paciente"
              options={OBRAS_SOCIALES}
              placeholder="Escribí o elegí tu obra social..."
              {...register('obra_social')}
            />
            <p className="text-xs text-ink/40 mt-1">Podés escribir libremente si no está en la lista.</p>
          </div>

          <div>
            <label className="label">Zona</label>
            <ComboInput
              listId="zona-paciente"
              options={ZONAS_ALL}
              placeholder="Escribí o elegí: barrio, ciudad, provincia..."
              {...register('zona')}
            />
          </div>
        </div>

        <button type="submit" disabled={isSubmitting}
          className="btn-primary w-full py-3.5 text-base text-center">
          {isSubmitting ? 'Creando cuenta...' : 'Crear mi cuenta'}
        </button>

        <p className="text-sm text-center text-ink/50">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">Ingresá</Link>
        </p>
      </form>
    </div>
  )
}
