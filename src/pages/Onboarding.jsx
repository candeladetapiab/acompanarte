import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const OPCIONES = [
  {
    value: 'paciente',
    emoji: '🧡',
    title: 'Soy paciente o familiar',
    desc: 'Busco un acompañante terapéutico para mí o un ser querido.',
    activeBg: 'bg-secondary-50 border-secondary-400',
    inactiveBg: 'bg-white border-gray-200 hover:border-gray-300',
    badge: 'bg-secondary-100 text-secondary-600',
  },
  {
    value: 'at',
    emoji: '💜',
    title: 'Soy Acompañante Terapéutico',
    desc: 'Quiero ofrecer mis servicios y conectar con pacientes.',
    activeBg: 'bg-primary-50 border-primary-500',
    inactiveBg: 'bg-white border-gray-200 hover:border-gray-300',
    badge: 'bg-primary-100 text-primary-600',
  },
]

export default function Onboarding() {
  const [selected, setSelected] = useState(null)
  const navigate = useNavigate()

  function handleContinuar() {
    if (!selected) return
    navigate(selected === 'at' ? '/registro/at' : '/registro/paciente')
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col px-6 py-10">
      <button
        onClick={() => navigate('/')}
        className="text-ink/50 text-sm mb-10 self-start hover:text-ink transition-colors"
      >
        ← Volver
      </button>

      <div className="flex-1">
        <h1 className="text-3xl font-bold text-ink mb-2 leading-tight">
          ¿Cómo vas a usar<br />AcompañarTe?
        </h1>
        <p className="text-ink/50 mb-10">Elegí tu perfil para personalizar tu experiencia.</p>

        <div className="space-y-4">
          {OPCIONES.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSelected(opt.value)}
              className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                selected === opt.value ? opt.activeBg : opt.inactiveBg
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${opt.badge} flex items-center justify-center text-2xl flex-shrink-0`}>
                  {opt.emoji}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-ink mb-1">{opt.title}</div>
                  <div className="text-sm text-ink/55 leading-relaxed">{opt.desc}</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                  selected === opt.value ? 'border-primary-600 bg-primary-600' : 'border-gray-300'
                }`}>
                  {selected === opt.value && (
                    <svg viewBox="0 0 20 20" fill="white" className="w-3 h-3">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleContinuar}
        disabled={!selected}
        className="btn-primary w-full py-3.5 text-base text-center mt-8 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continuar
      </button>
    </div>
  )
}
