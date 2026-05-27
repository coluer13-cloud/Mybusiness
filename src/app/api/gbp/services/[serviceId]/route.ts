import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createServerClient } from '@/lib/supabase/server'
import { deleteServiceItem } from '@/lib/gbp/client'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ serviceId: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.access_token) return NextResponse.json({ error: 'No access token' }, { status: 401 })

  const { serviceId } = await params
  const supabase = createServerClient()

  const { data: service } = await supabase
    .from('gbp_services')
    .select('service_id')
    .eq('id', serviceId)
    .eq('user_id', session.user!.email!)
    .single()

  if (!service) return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })

  try {
    if (service.service_id) {
      await deleteServiceItem(service.service_id, session.access_token)
    }
    await supabase.from('gbp_services').delete().eq('id', serviceId).eq('user_id', session.user!.email!)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al eliminar servicio'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
