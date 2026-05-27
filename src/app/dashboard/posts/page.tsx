'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Trash2 } from 'lucide-react'

interface Post {
  id: string
  post_id: string
  topic_type: string
  summary: string | null
  create_time: string | null
}

const TOPIC_LABELS: Record<string, string> = {
  STANDARD: 'Actualización', EVENT: 'Evento', OFFER: 'Oferta', ALERT: 'Aviso',
}
const TOPIC_COLORS: Record<string, string> = {
  STANDARD: 'bg-blue-100 text-blue-700',
  EVENT: 'bg-purple-100 text-purple-700',
  OFFER: 'bg-green-100 text-green-700',
  ALERT: 'bg-red-100 text-red-700',
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/gbp/posts-list')
    if (res.ok) setPosts(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este post de Google Business?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/gbp/posts/${id}`, { method: 'DELETE' })
      if (res.ok) await load()
      else {
        const { error } = await res.json()
        alert(`Error: ${error}`)
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Google Posts</h1>
          <p className="text-sm text-gray-400 mt-0.5">{posts.length} posts</p>
        </div>
        <Link
          href="/dashboard/posts/new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo post
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Cargando posts…</div>
      ) : !posts.length ? (
        <div className="text-center py-16 text-gray-400">
          <p>No hay posts todavía.</p>
          <Link href="/dashboard/posts/new" className="text-sm text-blue-600 hover:underline mt-2 block">
            Crear primer post
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.post_id} className="rounded-xl bg-white border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TOPIC_COLORS[post.topic_type]}`}>
                      {TOPIC_LABELS[post.topic_type] ?? post.topic_type}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(post.create_time)}</span>
                  </div>
                  <p className="text-sm text-gray-800 line-clamp-3">{post.summary}</p>
                </div>
                <button
                  onClick={() => handleDelete(post.id)}
                  disabled={deletingId === post.id}
                  className="shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
