import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createServerClient } from '@/lib/supabase/server'
import { createPhoto } from '@/lib/gbp/client'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.access_token) return NextResponse.json({ error: 'No access token' }, { status: 401 })

  const { sourceUrl, category, description } = await req.json()
  if (!sourceUrl?.trim()) return NextResponse.json({ error: 'La URL de la foto es obligatoria' }, { status: 400 })
  if (!/^https?:\/\/.+/.test(sourceUrl)) return NextResponse.json({ error: 'URL inválida' }, { status: 400 })

  const supabase = createServerClient()
  const { data: config } = await supabase
    .from('gbp_config')
    .select('location_id')
    .eq('user_id', session.user!.email!)
    .single()

  if (!config) return NextResponse.json({ error: 'Sin configuración GBP. Sincroniza primero.' }, { status: 400 })

  try {
    const body: Record<string, unknown> = {
      mediaFormat: 'PHOTO',
      sourceUrl: sourceUrl.trim(),
      locationAssociation: { category: category ?? 'ADDITIONAL' },
    }
    if (description?.trim()) body.description = description.trim()

    const created = await createPhoto(config.location_id, body, session.access_token)

    const { data: inserted } = await supabase.from('gbp_photos').insert({
      user_id: session.user!.email!,
      media_item_id: created.name,
      category: category ?? 'ADDITIONAL',
      google_url: created.googleUrl ?? sourceUrl,
      thumbnail_url: created.thumbnailUrl ?? null,
      description: description?.trim() || null,
      dimensions: created.dimensions ?? {},
    }).select().single()

    return NextResponse.json(inserted)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al subir foto'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
