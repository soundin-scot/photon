import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  // Only callable by the relay service
  const secret = request.headers.get('x-relay-secret')
  const expected = process.env.RELAY_SERVICE_SECRET

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { relayToken?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.relayToken) {
    return NextResponse.json({ error: 'relayToken required' }, { status: 400 })
  }

  const supabase = getSupabaseServer()

  const { data, error } = await supabase
    .from('instances')
    .select('id')
    .eq('relay_token', body.relayToken)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Invalid relay token' }, { status: 404 })
  }

  return NextResponse.json({ instanceId: data.id })
}
