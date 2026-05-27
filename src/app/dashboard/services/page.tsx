'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, ShoppingBag } from 'lucide-react'

interface Service {
  id: string
  service_id: string | null
  name: string
  description: string | null
  price: Record<string, unknown>
  is_offered: boolean
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [priceUnits, setPriceUnits] = useState('')
  const [priceCurrency, setPriceCurrency] = useState('EUR')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/gbp/services')
    if (res.ok) setServices(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/gbp/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          price: priceUnits ? { units: priceUnits, currencyCode: priceCurrency } : undefined,
        }),
      })
      if (res.ok) {
        setName(''); setDescription(''); setPriceUnits(''); setShowForm(false)
        await load()
      } else {
        const { error } = await res.json()
        alert(`Error: ${error}`)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este servicio?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/gbp/services/${id}`, { method: 'DELETE' })
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
          <h1 className="text-2xl font-bold text-gray-900">Servicios y productos</h1>
          <p className="text-sm text-gray-400 mt-0.5">{services.length} servicios</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo servicio
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="rounded-2xl bg-white border border-blue-100 shadow-sm p-6 mb-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Añadir servicio</h2>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              maxLength={120}
              placeholder="Ej: Corte de pelo, Consulta gratuita…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Descripción (opcional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="Breve descripción del servicio…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Precio (opcional)</label>
              <input
                type="number"
                value={priceUnits}
                onChange={e => setPriceUnits(e.target.value)}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Moneda</label>
              <select
                value={priceCurrency}
                onChange={e => setPriceCurrency(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="MXN">MXN</option>
                <option value="COP">COP</option>
                <option value="ARS">ARS</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {saving ? 'Guardando…' : 'Añadir servicio'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Cargando servicios…</div>
      ) : !services.length ? (
        <div className="text-center py-16 text-gray-400">
          <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin servicios todavía</p>
          <p className="text-sm mt-1">Añade tus servicios o sincroniza para importarlos desde Google Business.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map(s => (
            <div key={s.id} className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                {s.description && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{s.description}</p>
                )}
                {!!s.price?.units && (
                  <p className="text-xs font-semibold text-blue-600 mt-1">
                    {String(s.price.units)} {String(s.price.currencyCode ?? 'EUR')}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(s.id)}
                disabled={deletingId === s.id}
                className="shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
