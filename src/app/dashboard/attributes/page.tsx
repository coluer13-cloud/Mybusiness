import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createServerClient } from '@/lib/supabase/server'
import type { GbpQuestionRow, GbpAttributeRow } from '@/types/app'
import { QuestionCard } from './QuestionCard'

export const revalidate = 0

export default async function AttributesPage() {
  const session = await getServerSession(authOptions)
  const userId = session!.user!.email!
  const supabase = createServerClient()

  const [{ data: attributes }, { data: questions }] = await Promise.all([
    supabase.from('gbp_attributes').select('*').eq('user_id', userId).single(),
    supabase.from('gbp_questions').select('*').eq('user_id', userId).order('upvote_count', { ascending: false }),
  ])

  const attrList = (attributes?.attributes ?? []) as Record<string, unknown>[]
  const questionList = (questions ?? []) as GbpQuestionRow[]
  const unanswered = questionList.filter(q => !q.answer_text).length

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Atributos y Preguntas</h1>
        <p className="text-sm text-gray-400 mt-0.5">Gestiona atributos del negocio y responde preguntas de clientes</p>
      </div>

      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Atributos del negocio</h2>
          <span className="text-xs text-gray-400">{attrList.length} configurados</span>
        </div>
        {!attrList.length ? (
          <p className="text-sm text-gray-400">Sin atributos configurados. Sincroniza primero.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {attrList.slice(0, 20).map((attr, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                <span className="truncate">{String(attr.name ?? '').replace(/^attributes\//, '')}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-4">
          Para editar atributos, hazlo directamente en Google Business Profile y luego sincroniza.
        </p>
      </div>

      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Preguntas de clientes (Q&A)</h2>
          {unanswered > 0 && (
            <span className="text-xs font-medium bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
              {unanswered} sin responder
            </span>
          )}
        </div>

        {!questionList.length ? (
          <p className="text-sm text-gray-400">Sin preguntas todavía. Sincroniza para cargar las preguntas.</p>
        ) : (
          <div className="space-y-4">
            {questionList.map(q => (
              <QuestionCard key={q.question_id} question={q} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
