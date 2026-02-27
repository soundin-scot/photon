import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { getSupabaseServer } from '@/lib/supabase'

const createSchema = z.object({
  instanceId: z.string().uuid(),
  name: z.string().min(1).max(128),
  data: z.record(z.string(), z.array(z.number())), // { "0": [ch0..511], "1": [...] }
})

async function canAccessInstance(userId: string, instanceId: string): Promise<boolean> {
  const supabase = getSupabaseServer()

  const { data: instance } = await supabase
    .from('instances')
    .select('owner_id')
    .eq('id', instanceId)
    .single()

  if (instance?.owner_id === userId) return true

  const { data: perm } = await supabase
    .from('instance_permissions')
    .select('role')
    .eq('instance_id', instanceId)
    .eq('user_id', userId)
    .single()

  return !!perm
}

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const instanceId = request.nextUrl.searchParams.get('instanceId')
  if (!instanceId) return NextResponse.json({ error: 'instanceId required' }, { status: 400 })

  const hasAccess = await canAccessInstance(userId, instanceId)
  if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = getSupabaseServer()
  const { data, error } = await supabase
    .from('showfiles')
    .select('id, name, created_at, updated_at')
    .eq('instance_id', instanceId)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Fetch failed' }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { instanceId, name, data } = parsed.data
  const hasAccess = await canAccessInstance(userId, instanceId)
  if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = getSupabaseServer()
  const { data: showfile, error } = await supabase
    .from('showfiles')
    .insert({ instance_id: instanceId, name, data })
    .select('id, name, created_at, updated_at')
    .single()

  if (error) return NextResponse.json({ error: 'Create failed' }, { status: 500 })
  return NextResponse.json(showfile, { status: 201 })
}
