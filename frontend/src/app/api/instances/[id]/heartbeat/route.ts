import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Heartbeat is called by the relay service, authenticated via shared secret
  const secret = request.headers.get('x-relay-secret')
  const expected = process.env.RELAY_SERVICE_SECRET

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const supabase = getSupabaseServer()

  const { error } = await supabase
    .from('instances')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
