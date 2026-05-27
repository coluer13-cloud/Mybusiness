import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createServerClient } from '@/lib/supabase/server'
import { updateOpeningHours } from '@/lib/gbp/client'

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.access_token) return NextResponse.json({ error: 'No access token' }, { status: 401 })

  const { periods } = await req.json()
  if (!Array.isArray(periods)) return NextResponse.json({ error: 'periods debe ser un array' }, { status: 400 })

  const supabase = createServerClient()
  const { data: config } = await supabase
    .from('gbp_config')
    .select('location_id')
    .eq('user_id', session.user!.email!)
    .single()

  if (!config) return NextResponse.json({ error: 'Sin configuración GBP. Sincroniza primero.' }, { status: 400 })

  try {
    await updateOpeningHours(config.location_id, periods, session.access_token)

    await supabase
      .from('business_profile')
      .update({ regular_hours: periods, updated_at: new Date().toISOString() })
      .eq('user_id', session.user!.email!)

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al actualizar horarios'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
