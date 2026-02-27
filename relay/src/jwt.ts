import { jwtVerify } from 'jose'

export interface RelayTokenPayload {
  sub: string
  instanceId: string
}

let secret: Uint8Array | null = null

function getSecret(): Uint8Array {
  if (!secret) {
    const raw = process.env.RELAY_SERVICE_SECRET
    if (!raw) throw new Error('RELAY_SERVICE_SECRET is not set')
    secret = new TextEncoder().encode(raw)
  }
  return secret
}

export async function verifyClientToken(token: string): Promise<RelayTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    const sub = payload.sub as string
    const instanceId = payload.instanceId as string
    if (!sub || !instanceId) return null
    return { sub, instanceId }
  } catch {
    return null
  }
}
