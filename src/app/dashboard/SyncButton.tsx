'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function SyncButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSync() {
    setLoading(true)
    try {
      const res = await fetch('/api/gbp/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        const error = data?.error as string | undefined
        if (error?.includes('RATE_LIMIT') || error?.includes('429')) {
          alert('⏳ Cuota de Google agotada.\n\nEspera 60 segundos e inténtalo de nuevo.\n\nSi el problema persiste, aumenta la cuota en Google Cloud Console → APIs y servicios → Cuotas.')
        } else {
          alert(`Error al sincronizar: ${error}`)
        }
      } else {
        const errors = data?.errors as Record<string, string> | undefined
        if (errors && Object.keys(errors).length) {
          const labelNames: Record<string, string> = {
            location: 'Perfil del negocio',
            reviews: 'Reseñas',
            posts: 'Publicaciones',
            photos: 'Fotos',
            attributes: 'Atributos',
            questions: 'Preguntas y respuestas',
            services: 'Servicios',
          }
          const lines = Object.entries(errors).map(([key, msg]) => {
            let reason = msg
            if (msg.includes('RATE_LIMIT') || msg.includes('429')) {
              reason = 'cuota de Google agotada (espera o aumenta la cuota en Google Cloud Console)'
            } else if (msg.includes('GBP_UNAUTHORIZED') || msg.includes('401')) {
              reason = 'sesión expirada, vuelve a iniciar sesión'
            } else if (msg.includes('403')) {
              reason = 'acceso denegado por Google (revisa que la API esté habilitada y tu cuenta tenga permisos sobre el negocio)'
            } else if (msg.includes('404')) {
              reason = 'no encontrado (puede que el negocio no tenga datos de este tipo)'
            }
            return `• ${labelNames[key] ?? key}: ${reason}`
          })
          alert(`⚠️ Sincronización completada con algunos datos pendientes:\n\n${lines.join('\n')}`)
        }
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={loading}
      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
    >
      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Sincronizando…' : 'Sincronizar ahora'}
    </button>
  )
}
