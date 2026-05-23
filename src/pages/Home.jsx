import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function Home() {
  const { user, profile } = useAuth()

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-ink via-primary-800 to-primary-600 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight tracking-tight">
            Conectamos Acompañantes Terapéuticos con quienes los necesitan
          </h1>
          <p className="text-lg text-primary-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Encontrá el AT ideal según tu zona, obra social y necesidad. Rápido, transparente y sin intermediarios.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/buscar" className="bg-white text-primary-700 font-semibold px-8 py-3 rounded-xl hover:bg-cream transition-colors">
              Buscar un AT
            </Link>
            {!user && (
              <Link to="/registro" className="border-2 border-white/70 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors">
                Soy AT, me registro
              </Link>
            )}
            {user && profile?.rol === 'paciente' && (
              <Link to="/publicar-busqueda" className="border-2 border-white/70 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors">
                Publicar mi búsqueda
              </Link>
            )}
          </div>

          {/* Botones de sesión — solo si no está logueado */}
          {!user && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Link
                to="/login"
                className="text-white/80 hover:text-white text-sm font-medium underline underline-offset-4 transition-colors"
              >
                Ya tengo cuenta — Ingresar
              </Link>
              <span className="text-white/30">·</span>
              <Link
                to="/onboarding"
                className="bg-[#E8A87C] hover:bg-[#d4956a] text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors shadow-sm"
              >
                Registrarme gratis
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-ink mb-12">¿Cómo funciona?</h2>
        <div className="grid md:grid-cols-3 gap-10">
          {[
            { icon: '🔍', title: 'Buscá', desc: 'Filtrá por zona, obra social y especialidad para encontrar el AT que necesitás.', color: 'bg-primary-50' },
            { icon: '📋', title: 'Conocé', desc: 'Revisá el perfil completo: experiencia, honorarios, reseñas de otros pacientes.', color: 'bg-secondary-50' },
            { icon: '💬', title: 'Contactá', desc: 'Enviá un mensaje directo al AT o publicá tu búsqueda para que te contacten.', color: 'bg-accent-50' },
          ].map(step => (
            <div key={step.title} className="text-center">
              <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4`}>
                {step.icon}
              </div>
              <h3 className="font-semibold text-lg mb-2 text-ink">{step.title}</h3>
              <p className="text-ink/60 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-50 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-ink mb-3">¿Sos Acompañante Terapéutico?</h2>
          <p className="text-ink/60 mb-8 leading-relaxed">Creá tu perfil profesional, recibí consultas y conectá con pacientes y familias que te necesitan.</p>
          {!user ? (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/onboarding" className="btn-primary px-8 py-3">
                Crear mi perfil profesional
              </Link>
              <Link to="/login" className="border-2 border-primary-300 text-primary-700 font-semibold px-8 py-3 rounded-xl hover:bg-primary-100 transition-colors">
                Ya tengo cuenta
              </Link>
            </div>
          ) : profile?.rol === 'at' ? (
            <Link to="/dashboard/at" className="btn-primary px-8 py-3">
              Ver mi perfil
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  )
}
