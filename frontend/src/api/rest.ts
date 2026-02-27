const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || ''
const BASE = `${BACKEND}/api`

export interface Config {
  universeCount: number
  webPort: number
  [key: string]: unknown
}

export interface UniverseData {
  id: number
  channels: number[]
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

export async function fetchConfig(): Promise<Config> {
  const res = await fetch(`${BASE}/config`)
  return handleResponse<Config>(res)
}

export async function fetchUniverses(): Promise<UniverseData[]> {
  const res = await fetch(`${BASE}/universes`)
  return handleResponse<UniverseData[]>(res)
}

export async function postBlackout(): Promise<{ ok: boolean }> {
  const res = await fetch(`${BASE}/blackout`, { method: 'POST' })
  return handleResponse<{ ok: boolean }>(res)
}

export async function setChannel(
  universe: number,
  channel: number,
  value: number
): Promise<void> {
  const res = await fetch(`${BASE}/universes/${universe}/channels/${channel}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value })
  })
  await handleResponse<unknown>(res)
}

export async function setChannels(
  universe: number,
  channels: Record<string, number>
): Promise<void> {
  const res = await fetch(`${BASE}/universes/${universe}/channels`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channels })
  })
  await handleResponse<unknown>(res)
}
