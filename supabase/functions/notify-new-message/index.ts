import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const payload = await req.json()
    const mensaje = payload.record

    if (!mensaje) return new Response('No record', { status: 400 })

    // Crear cliente de Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Buscar el email del receptor
    const { data: receptor } = await supabase
      .from('at_profiles')
      .select('nombre, email')
      .eq('id', mensaje.receiver_id)
      .maybeSingle()

    if (!receptor?.email) return new Response('No email', { status: 200 })

    // Enviar email con Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: 'AcompañarTe <notificaciones@acompanarte.com.ar>',
        to: receptor.email,
        subject: '💬 Tenés un mensaje nuevo en AcompañarTe',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2D1F45, #7C5C9E); padding: 32px; border-radius: 16px 16px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 22px;">AcompañarTe</h1>
              <p style="color: #C9A8E8; margin: 4px 0 0;">Porque nadie debería caminar solo.</p>
            </div>
            <div style="background: #F5F0FA; padding: 32px; border-radius: 0 0 16px 16px;">
              <p style="color: #2D1F45; font-size: 16px;">Hola ${receptor.nombre ?? ''} 👋</p>
              <p style="color: #4a4a4a;">Recibiste un mensaje nuevo en AcompañarTe.</p>
              <div style="background: white; border-left: 4px solid #E8A87C; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #4a4a4a; margin: 0; font-style: italic;">"${mensaje.content}"</p>
              </div>
              <a href="https://acompanarte-five.vercel.app/mensajes" 
                style="display: inline-block; background: #7C5C9E; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 8px;">
                Ver mensaje →
              </a>
            </div>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return new Response(`Resend error: ${err}`, { status: 500 })
    }

    return new Response('Email enviado', { status: 200 })
  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 500 })
  }
})