import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const cat = searchParams.get('cat')
  const supabase = createServerClient()

  let query = supabase
    .from('gbp_photos')
    .select('*')
    .eq('user_id', session.user!.email!)
    .order('created_at', { ascending: false })

  if (cat) query = query.eq('category', cat)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
