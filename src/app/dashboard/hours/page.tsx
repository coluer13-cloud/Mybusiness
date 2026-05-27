'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Clock } from 'lucide-react'

const DAYS = [
  { id: 'MONDAY', label: 'Lunes' },
  { id: 'TUESDAY', label: 'Martes' },
  { id: 'WEDNESDAY', label: 'Miércoles' },
  { id: 'THURSDAY', label: 'Jueves' },
  { id: 'FRIDAY', label: 'Viernes' },
  { id: 'SATURDAY', label: 'Sábado' },
  { id: 'SUNDAY', label: 'Domingo' },
]

interface DaySchedule {
  open: boolean
  openTime: string
  closeTime: string
}

type WeekSchedule = Record<string, DaySchedule>

function defaultSchedule(): WeekSchedule {
  return Object.fromEntries(
    DAYS.map(d => [d.id, { open: !['SATURDAY', 'SUNDAY'].includes(d.id), openTime: '09:00', closeTime: '18:00' }]),
  )
}

function periodsToSchedule(periods: Record<string, unknown>[]): WeekSchedule {
  const schedule = defaultSchedule()
  for (const day of DAYS) schedule[day.id].open = false
  for (const p of periods) {
    const day = p.openDay as string
    if (!day) continue
    const oh = p.openTime as { hours?: number; minutes?: number } | undefined
    const ch = p.closeTime as { hours?: number; minutes?: number } | undefined
    schedule[day] = {
      open: true,
      openTime: `${String(oh?.hours ?? 9).padStart(2, '0')}:${String(oh?.minutes ?? 0).padStart(2, '0')}`,
      closeTime: `${String(ch?.hours ?? 18).padStart(2, '0')}:${String(ch?.minutes ?? 0).padStart(2, '0')}`,
    }
  }
  return schedule
}

function scheduleToPeriods(schedule: WeekSchedule) {
  return DAYS.filter(d => schedule[d.id].open).map(d => {
    const [oh, om] = schedule[d.id].openTime.split(':').map(Number)
    const [ch, cm] = schedule[d.id].closeTime.split(':').map(Number)
    return {
      openDay: d.id,
      openTime: { hours: oh, minutes: om },
      closeDay: d.id,
      closeTime: { hours: ch, minutes: cm },
    }
  })
}

export default function HoursPage() {
  const [schedule, setSchedule] = useState<WeekSchedule>(defaultSchedule())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/gbp/profile')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data?.regular_hours) && data.regular_hours.length) {
          setSchedule(periodsToSchedule(data.regular_hours))
        }
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function setDay(dayId: string, field: keyof DaySchedule, value: string | boolean) {
    setSchedule(prev => ({ ...prev, [dayId]: { ...prev[dayId], [field]: value } }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const periods = scheduleToPeriods(schedule)
      const res = await fetch('/api/gbp/hours', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periods }),
      })
      if (res.ok) {
        router.refresh()
        alert('Horarios guardados correctamente')
      } else {
        const { error } = await res.json()
        alert(`Error: ${error}`)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-16 text-gray-400 text-sm">Cargando horarios…</div>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Horarios de apertura</h1>
        <p className="text-sm text-gray-400 mt-0.5">Define cuándo está abierto tu negocio cada día</p>
      </div>

      <form onSubmit={handleSave} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-4">
        {DAYS.map(day => (
          <div key={day.id} className="flex items-center gap-4">
            <label className="flex items-center gap-2 w-32 shrink-0 cursor-pointer">
              <input
                type="checkbox"
                checked={schedule[day.id].open}
                onChange={e => setDay(day.id, 'open', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className={`text-sm font-medium ${schedule[day.id].open ? 'text-gray-900' : 'text-gray-400'}`}>
                {day.label}
              </span>
            </label>

            {schedule[day.id].open ? (
              <div className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="time"
                    value={schedule[day.id].openTime}
                    onChange={e => setDay(day.id, 'openTime', e.target.value)}
                    className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span className="text-gray-400 text-sm">—</span>
                <input
                  type="time"
                  value={schedule[day.id].closeTime}
                  onChange={e => setDay(day.id, 'closeTime', e.target.value)}
                  className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <span className="text-sm text-gray-400 italic">Cerrado</span>
            )}
          </div>
        ))}

        <div className="pt-3 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {saving ? 'Guardando…' : 'Guardar horarios'}
          </button>
        </div>
      </form>

      <p className="text-xs text-gray-400 mt-3 text-center">
        Los cambios se aplican directamente en Google Business Profile
      </p>
    </div>
  )
}
