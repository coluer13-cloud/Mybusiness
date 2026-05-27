import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createServerClient } from '@/lib/supabase/server'
import { createServiceItem } from '@/lib/gbp/client'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('gbp_services')
    .select('*')
    .eq('user_id', session.user!.email!)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.access_token) return NextResponse.json({ error: 'No access token' }, { status: 401 })

  const { name, description, price } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })

  const supabase = createServerClient()
  const { data: config } = await supabase
    .from('gbp_config')
    .select('location_id')
    .eq('user_id', session.user!.email!)
    .single()

  if (!config) return NextResponse.json({ error: 'Sin configuración GBP. Sincroniza primero.' }, { status: 400 })

  try {
    const body: Record<string, unknown> = {
      freeFormServiceItem: {
        category: { displayName: 'Servicios', categoryId: 'gcid:service_establishment' },
        label: { displayName: name.trim(), description: description?.trim() || undefined, languageCode: 'es' },
      },
      isOffered: true,
    }
    if (price?.units) {
      body.price = { currencyCode: price.currencyCode ?? 'EUR', units: String(price.units), nanos: 0 }
    }

    const created = await createServiceItem(config.location_id, body, session.access_token)

    const { data: inserted } = await supabase.from('gbp_services').insert({
      user_id: session.user!.email!,
      service_id: created.name,
      name: name.trim(),
      description: description?.trim() || null,
      price: body.price ?? {},
      is_offered: true,
    }).select().single()

    return NextResponse.json(inserted)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al crear servicio'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
