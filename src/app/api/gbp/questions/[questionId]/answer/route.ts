import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createServerClient } from '@/lib/supabase/server'
import { createAnswer, deleteAnswer } from '@/lib/gbp/client'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ questionId: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.access_token) return NextResponse.json({ error: 'No access token' }, { status: 401 })

  const { questionId } = await params
  const { text } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: 'La respuesta no puede estar vacía' }, { status: 400 })

  const supabase = createServerClient()
  const { data: question } = await supabase
    .from('gbp_questions')
    .select('question_id')
    .eq('id', questionId)
    .eq('user_id', session.user!.email!)
    .single()

  if (!question) return NextResponse.json({ error: 'Pregunta no encontrada' }, { status: 404 })

  try {
    const result = await createAnswer(question.question_id, text.trim(), session.access_token)

    await supabase
      .from('gbp_questions')
      .update({
        answer_text: text.trim(),
        answer_time: result.updateTime ?? new Date().toISOString(),
        answer_author: result.author ?? {},
      })
      .eq('id', questionId)
      .eq('user_id', session.user!.email!)

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al responder pregunta'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ questionId: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.access_token) return NextResponse.json({ error: 'No access token' }, { status: 401 })

  const { questionId } = await params
  const supabase = createServerClient()

  const { data: question } = await supabase
    .from('gbp_questions')
    .select('question_id')
    .eq('id', questionId)
    .eq('user_id', session.user!.email!)
    .single()

  if (!question) return NextResponse.json({ error: 'Pregunta no encontrada' }, { status: 404 })

  try {
    await deleteAnswer(question.question_id, session.access_token)

    await supabase
      .from('gbp_questions')
      .update({ answer_text: null, answer_time: null, answer_author: {} })
      .eq('id', questionId)
      .eq('user_id', session.user!.email!)

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al eliminar respuesta'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
