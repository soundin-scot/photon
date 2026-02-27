import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { getSupabaseServer } from '@/lib/supabase'

const updateSchema = z.object({
  name: z.string().min(1).max(64).optional(),
  universeCount: z.number().int().min(1).max(64).optional(),
})

async function canAccess(userId: string, instanceId: string): Promise<'owner' | 'operator' | 'viewer' | null> {
  const supabase = getSupabaseServer()

  const { data: instance } = await supabase
    .from('instances')
    .select('owner_id')
    .eq('id', instanceId)
    .single()

  if (instance?.owner_id === userId) return 'owner'

  const { data: perm } = await supabase
    .from('instance_permissions')
    .select('role')
    .eq('instance_id', instanceId)
    .eq('user_id', userId)
    .single()

  if (perm) return perm.role as 'operator' | 'viewer'
  return null
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const role = await canAccess(userId, id)
  if (!role) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const supabase = getSupabaseServer()
  const { data, error } = await supabase
    .from('instances')
    .select('id, name, slug, universe_count, last_seen_at, relay_token, created_at')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only owner sees relay_token
  if (role !== 'owner') {
    const { relay_token: _, ...safe } = data
    return NextResponse.json({ ...safe, role })
  }

  return NextResponse.json({ ...data, role })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const role = await canAccess(userId, id)
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) updates.name = parsed.data.name
  if (parsed.data.universeCount !== undefined) updates.universe_count = parsed.data.universeCount

  const supabase = getSupabaseServer()
  const { data, error } = await supabase
    .from('instances')
    .update(updates)
    .eq('id', id)
    .select('id, name, slug, universe_count, last_seen_at, created_at')
    .single()

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const role = await canAccess(userId, id)
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = getSupabaseServer()
  const { error } = await supabase.from('instances').delete().eq('id', id)

  if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
