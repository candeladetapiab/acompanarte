import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import toast from 'react-hot-toast'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const rolParam = searchParams.get('rol') ?? 'paciente'

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { rol: rolParam }
  })
  const rol = watch('rol')

  async function onSubmit(data) {
    if (data.password !== data.confirmar) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    try {
      await signUp({
        email: data.email,
        password: data.password,
        nombre: data.nombre,
        apellido: data.apellido,
        rol: data.rol,
      })
      toast.success('¡Cuenta creada! Revisá tu email para confirmar.')
      navigate('/login')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 py-10">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-ink mb-1">Crear cuenta</h1>
        <p className="text-sm text-ink/50 mb-6">Únite a la comunidad AcompañarTe</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tipo de usuario */}
          <div>
            <label className="label">Soy...</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'paciente', label: 'Paciente / Familia', desc: 'Busco un AT' },
                { value: 'at', label: 'Acompañante Terapéutico', desc: 'Ofrezco mis servicios' },
              ].map(opt => (
                <label
                  key={opt.value}
                  className={`border-2 rounded-xl p-3 cursor-pointer transition-all ${
                    rol === opt.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-200'
                  }`}
                >
                  <input type="radio" value={opt.value} className="sr-only" {...register('rol')} />
                  <div className="font-medium text-sm text-ink">{opt.label}</div>
                  <div className="text-xs text-ink/50 mt-0.5">{opt.desc}</div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nombre</label>
              <input
                type="text"
                className="input-field"
                {...register('nombre', { required: 'Requerido' })}
              />
              {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre.message}</p>}
            </div>
            <div>
              <label className="label">Apellido</label>
              <input
                type="text"
                className="input-field"
                {...register('apellido', { required: 'Requerido' })}
              />
              {errors.apellido && <p className="text-red-400 text-xs mt-1">{errors.apellido.message}</p>}
            </div>
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="tu@email.com"
              {...register('email', { required: 'El email es obligatorio' })}
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label">Contraseña</label>
            <input
              type="password"
              className="input-field"
              placeholder="Mínimo 6 caracteres"
              {...register('password', { required: 'Requerida', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })}
            />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="label">Confirmar contraseña</label>
            <input
              type="password"
              className="input-field"
              placeholder="Repetí la contraseña"
              {...register('confirmar', { required: 'Requerida' })}
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2 text-center">
            {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-sm text-center text-ink/50 mt-6">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">
            Ingresá
          </Link>
        </p>
      </div>
    </div>
  )
}
