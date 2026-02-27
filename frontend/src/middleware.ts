import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PUBLIC_EXACT = new Set(['/', '/login', '/register'])

const PUBLIC_PREFIXES = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/register',
]

// Endpoints that use their own auth (e.g., relay service secret)
// Endpoints that use their own auth (e.g., relay service secret)
const SERVICE_AUTH_PATTERNS = [
  /^\/api\/instances\/[^/]+\/heartbeat$/,
  /^\/api\/relay\/verify-engine$/,
]

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_EXACT.has(pathname)) {
    return NextResponse.next()
  }

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  if (SERVICE_AUTH_PATTERNS.some((p) => p.test(pathname))) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // CSRF check for mutating API requests
  if (pathname.startsWith('/api/') && MUTATING_METHODS.has(request.method)) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')

    if (!origin) {
      return NextResponse.json({ error: 'Missing origin header' }, { status: 403 })
    }

    try {
      const originHost = new URL(origin).host
      if (originHost !== host) {
        return NextResponse.json({ error: 'Origin mismatch' }, { status: 403 })
      }
    } catch {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
    }
  }

  const token = request.cookies.get('photon-token')?.value

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const payload = await verifyToken(token)

  if (!payload) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('photon-token')
    return response
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', payload.sub)
  requestHeaders.set('x-username', payload.username)

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
