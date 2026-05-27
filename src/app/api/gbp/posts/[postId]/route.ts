import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createServerClient } from '@/lib/supabase/server'
import { deletePost } from '@/lib/gbp/client'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.access_token) return NextResponse.json({ error: 'No access token' }, { status: 401 })

  const { postId } = await params
  const supabase = createServerClient()

  const { data: post } = await supabase
    .from('gbp_posts')
    .select('post_id')
    .eq('id', postId)
    .eq('user_id', session.user!.email!)
    .single()

  if (!post) return NextResponse.json({ error: 'Post no encontrado' }, { status: 404 })

  try {
    await deletePost(post.post_id, session.access_token)
    await supabase.from('gbp_posts').delete().eq('id', postId).eq('user_id', session.user!.email!)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al eliminar post'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
