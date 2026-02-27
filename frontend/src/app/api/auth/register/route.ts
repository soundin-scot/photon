import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseServer } from '@/lib/supabase'
import { hashPassword, signToken } from '@/lib/auth'

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username must be at most 32 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { username, email, password } = parsed.data
  const supabase = getSupabaseServer()

  // Check for existing user
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .or(`username.eq.${username},email.eq.${email}`)
    .limit(1)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Username or email already taken' }, { status: 409 })
  }

  const passwordHash = await hashPassword(password)

  const { data: user, error } = await supabase
    .from('users')
    .insert({ username, email, password_hash: passwordHash })
    .select('id, username')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }

  const token = await signToken({ sub: user.id, username: user.username })

  const response = NextResponse.json({ id: user.id, username: user.username })
  response.cookies.set('photon-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  })

  return response
}
