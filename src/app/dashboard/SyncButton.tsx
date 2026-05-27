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
      if (!res.ok) {
        const { error } = await res.json()
        if (error?.includes('RATE_LIMIT') || error?.includes('429')) {
          alert('⏳ Cuota de Google agotada.\n\nEspera 60 segundos e inténtalo de nuevo.\n\nSi el problema persiste, aumenta la cuota en Google Cloud Console → APIs y servicios → Cuotas.')
        } else {
          alert(`Error al sincronizar: ${error}`)
        }
      } else {
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
