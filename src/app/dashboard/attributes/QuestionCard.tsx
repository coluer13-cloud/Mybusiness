'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Trash2 } from 'lucide-react'
import type { GbpQuestionRow } from '@/types/app'
import { formatDate } from '@/lib/utils'

export function QuestionCard({ question }: { question: GbpQuestionRow }) {
  const [reply, setReply] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleAnswer() {
    if (!reply.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/gbp/questions/${question.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: reply }),
      })
      if (res.ok) {
        router.refresh()
        setShowForm(false)
        setReply('')
      } else {
        const { error } = await res.json()
        alert(`Error: ${error}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteAnswer() {
    if (!confirm('¿Eliminar tu respuesta?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/gbp/questions/${question.id}/answer`, { method: 'DELETE' })
      if (res.ok) router.refresh()
      else {
        const { error } = await res.json()
        alert(`Error: ${error}`)
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="border border-gray-100 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{question.question_text}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDate(question.create_time)} · {question.upvote_count} votos
          </p>

          {question.answer_text ? (
            <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-blue-700 mb-1">Tu respuesta</p>
                  <p className="text-sm text-blue-900">{question.answer_text}</p>
                </div>
                <button
                  onClick={handleDeleteAnswer}
                  disabled={deleting}
                  className="shrink-0 p-1 text-blue-400 hover:text-red-500 transition-colors disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              {!showForm ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Responder pregunta
                </button>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder="Escribe tu respuesta…"
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAnswer}
                      disabled={submitting || !reply.trim()}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {submitting ? 'Enviando…' : 'Publicar respuesta'}
                    </button>
                    <button
                      onClick={() => { setShowForm(false); setReply('') }}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
