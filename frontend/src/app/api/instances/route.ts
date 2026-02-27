import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import { getSupabaseServer } from '@/lib/supabase'

const createSchema = z.object({
  name: z.string().min(1, 'Name is required').max(64),
  slug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  universeCount: z.number().int().min(1).max(64).default(4),
})

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseServer()

  // Get instances where user is owner or has permissions
  const { data: owned } = await supabase
    .from('instances')
    .select('id, name, slug, universe_count, last_seen_at, created_at')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })

  const { data: shared } = await supabase
    .from('instance_permissions')
    .select('role, instances(id, name, slug, universe_count, last_seen_at, created_at)')
    .eq('user_id', userId)

  const instances = [
    ...(owned ?? []).map((i) => ({ ...i, role: 'owner' as const })),
    ...(shared ?? []).map((s) => {
      const inst = s.instances as unknown as Record<string, unknown>
      return { ...inst, role: s.role }
    }),
  ]

  return NextResponse.json(instances)
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

  const { name, slug, universeCount } = parsed.data
  const relayToken = crypto.randomBytes(32).toString('hex')

  const supabase = getSupabaseServer()

  const { data, error } = await supabase
    .from('instances')
    .insert({
      owner_id: userId,
      name,
      slug,
      universe_count: universeCount,
      relay_token: relayToken,
    })
    .select('id, name, slug, universe_count, relay_token, created_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create instance' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
