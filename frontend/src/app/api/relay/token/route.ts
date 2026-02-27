import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SignJWT } from 'jose'
import { getSupabaseServer } from '@/lib/supabase'

function getRelaySecret(): Uint8Array {
  const secret = process.env.RELAY_SERVICE_SECRET
  if (!secret) throw new Error('RELAY_SERVICE_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { instanceId: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.instanceId) {
    return NextResponse.json({ error: 'instanceId required' }, { status: 400 })
  }

  const supabase = getSupabaseServer()

  // Check ownership
  const { data: instance } = await supabase
    .from('instances')
    .select('id, owner_id')
    .eq('id', body.instanceId)
    .single()

  if (!instance) {
    // Check permissions
    const { data: perm } = await supabase
      .from('instance_permissions')
      .select('role')
      .eq('instance_id', body.instanceId)
      .eq('user_id', userId)
      .single()

    if (!perm) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } else if (instance.owner_id !== userId) {
    const { data: perm } = await supabase
      .from('instance_permissions')
      .select('role')
      .eq('instance_id', body.instanceId)
      .eq('user_id', userId)
      .single()

    if (!perm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const token = await new SignJWT({ sub: userId, instanceId: body.instanceId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(getRelaySecret())

  return NextResponse.json({ token })
}
