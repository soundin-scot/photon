import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = getSupabaseServer()

  const { data, error } = await supabase
    .from('showfiles')
    .select('id, name, data')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Return the show data — frontend will replay it into dmxStore + send via WS
  return NextResponse.json({ id: data.id, name: data.name, data: data.data })
}
