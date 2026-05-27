import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createServerClient } from '@/lib/supabase/server'
import { deletePhoto } from '@/lib/gbp/client'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ mediaId: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.access_token) return NextResponse.json({ error: 'No access token' }, { status: 401 })

  const { mediaId } = await params
  const supabase = createServerClient()

  const { data: photo } = await supabase
    .from('gbp_photos')
    .select('media_item_id')
    .eq('id', mediaId)
    .eq('user_id', session.user!.email!)
    .single()

  if (!photo) return NextResponse.json({ error: 'Foto no encontrada' }, { status: 404 })

  try {
    await deletePhoto(photo.media_item_id, session.access_token)
    await supabase.from('gbp_photos').delete().eq('id', mediaId).eq('user_id', session.user!.email!)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al eliminar foto'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
