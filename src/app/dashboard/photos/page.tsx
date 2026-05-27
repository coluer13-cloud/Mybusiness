'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Trash2, Upload, X } from 'lucide-react'

interface Photo {
  id: string
  media_item_id: string
  category: string
  google_url: string
  thumbnail_url: string | null
  description: string | null
}

const CATEGORIES = [
  { id: 'ALL', label: 'Todas' },
  { id: 'COVER', label: 'Portada' },
  { id: 'LOGO', label: 'Logo' },
  { id: 'PROFILE', label: 'Perfil' },
  { id: 'INTERIOR', label: 'Interior' },
  { id: 'EXTERIOR', label: 'Exterior' },
  { id: 'PRODUCT', label: 'Productos' },
  { id: 'TEAMS', label: 'Equipo' },
  { id: 'AT_WORK', label: 'En acción' },
  { id: 'FOOD_AND_DRINK', label: 'Comida' },
  { id: 'ADDITIONAL', label: 'Otras' },
]

const UPLOAD_CATEGORIES = CATEGORIES.filter(c => c.id !== 'ALL')

export default function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [cat, setCat] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [sourceUrl, setSourceUrl] = useState('')
  const [uploadCategory, setUploadCategory] = useState('ADDITIONAL')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = cat !== 'ALL' ? `?cat=${cat}` : ''
    const res = await fetch(`/api/gbp/photos-list${params}`)
    if (res.ok) setPhotos(await res.json())
    setLoading(false)
  }, [cat])

  useEffect(() => { load() }, [load])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!sourceUrl.trim()) return
    setUploading(true)
    try {
      const res = await fetch('/api/gbp/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl, category: uploadCategory, description: uploadDescription || undefined }),
      })
      if (res.ok) {
        setSourceUrl(''); setUploadDescription(''); setShowUpload(false)
        await load()
      } else {
        const { error } = await res.json()
        alert(`Error: ${error}`)
      }
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta foto de Google Business?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/gbp/photos/${id}`, { method: 'DELETE' })
      if (res.ok) await load()
      else {
        const { error } = await res.json()
        alert(`Error: ${error}`)
      }
    } finally {
      setDeletingId(null)
    }
  }

  const visible = cat === 'ALL' ? photos : photos.filter(p => p.category === cat)

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fotos</h1>
          <p className="text-sm text-gray-400 mt-0.5">{visible.length} fotos</p>
        </div>
        <button
          onClick={() => setShowUpload(s => !s)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Subir foto
        </button>
      </div>

      {showUpload && (
        <form onSubmit={handleUpload} className="rounded-2xl bg-white border border-blue-100 shadow-sm p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Subir nueva foto</h2>
            <button type="button" onClick={() => setShowUpload(false)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">URL pública de la foto *</label>
            <input
              type="url"
              value={sourceUrl}
              onChange={e => setSourceUrl(e.target.value)}
              required
              placeholder="https://ejemplo.com/foto.jpg"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">La imagen debe ser accesible públicamente vía URL (min. 250px, max. 5MB)</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
              <select
                value={uploadCategory}
                onChange={e => setUploadCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {UPLOAD_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripción (opcional)</label>
              <input
                type="text"
                value={uploadDescription}
                onChange={e => setUploadDescription(e.target.value)}
                maxLength={100}
                placeholder="Descripción breve…"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={uploading || !sourceUrl.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {uploading ? 'Subiendo…' : 'Subir foto'}
            </button>
            <button
              type="button"
              onClick={() => setShowUpload(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              cat === c.id
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Cargando fotos…</div>
      ) : !visible.length ? (
        <div className="text-center py-16 text-gray-400">
          <p>No hay fotos en esta categoría.</p>
          <p className="text-sm mt-1">Sincroniza para cargar las fotos de Google Business.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {visible.map(photo => (
            <div key={photo.media_item_id} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100">
              <Image
                src={photo.google_url}
                alt={photo.description ?? photo.category}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              <span className="absolute bottom-2 left-2 rounded bg-black/60 text-white text-xs px-1.5 py-0.5">
                {photo.category}
              </span>
              <button
                onClick={() => handleDelete(photo.id)}
                disabled={deletingId === photo.id}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
