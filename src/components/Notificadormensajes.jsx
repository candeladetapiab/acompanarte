import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'

export default function NotificadorMensajes() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const toastRef = useRef(null)

  function mostrarToast(mensaje, senderId) {
    // Si ya hay un toast, lo eliminamos
    if (toastRef.current) {
      document.body.removeChild(toastRef.current)
    }

    const toast = document.createElement('div')
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2D1F45;
      color: white;
      padding: 14px 18px;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(45,31,69,0.25);
      z-index: 9999;
      max-width: 300px;
      cursor: pointer;
      border-left: 4px solid #E8A87C;
      animation: slideIn 0.3s ease;
      font-family: 'DM Sans', sans-serif;
    `

    toast.innerHTML = `
      <style>
        @keyframes slideIn { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      </style>
      <p style="font-size:11px; color:#C9A8E8; margin:0 0 4px 0; font-weight:600;">💬 Mensaje nuevo</p>
      <p style="font-size:13px; margin:0; color:white; line-height:1.4; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${mensaje}</p>
      <p style="font-size:11px; color:#C9A8E8; margin:6px 0 0 0;">Tocá para ver →</p>
    `

    toast.onclick = () => {
      navigate(`/mensajes/${senderId}`)
      document.body.removeChild(toast)
      toastRef.current = null
    }

    document.body.appendChild(toast)
    toastRef.current = toast

    // Se cierra solo después de 5 segundos
    setTimeout(() => {
      if (toastRef.current === toast) {
        toast.style.animation = 'none'
        toast.style.opacity = '0'
        toast.style.transition = 'opacity 0.3s ease'
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast)
          }
          toastRef.current = null
        }, 300)
      }
    }, 5000)
  }

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('notificador-global')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, payload => {
        const senderId = payload.new.sender_id
        const estaEnEseChat = location.pathname === `/mensajes/${senderId}`

        // Solo mostrar toast si no está en ese chat
        if (!estaEnEseChat) {
          mostrarToast(payload.new.content, senderId)
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user, location.pathname])

  return null
}