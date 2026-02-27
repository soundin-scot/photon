import type WebSocket from 'ws'
import { sendHeartbeat } from './heartbeat.js'

export interface EngineSession {
  ws: WebSocket
  instanceId: string
  heartbeatInterval: ReturnType<typeof setInterval> | null
  lastState: Map<number, string> // universe -> last JSON payload
  universeCount: number
}

const engines = new Map<string, EngineSession>()

export function getEngine(instanceId: string): EngineSession | undefined {
  return engines.get(instanceId)
}

export function registerEngine(instanceId: string, ws: WebSocket): EngineSession {
  // Close existing connection for this instance if any
  const existing = engines.get(instanceId)
  if (existing) {
    if (existing.heartbeatInterval) clearInterval(existing.heartbeatInterval)
    try { existing.ws.close() } catch { /* ignore */ }
  }

  const session: EngineSession = {
    ws,
    instanceId,
    heartbeatInterval: null,
    lastState: new Map(),
    universeCount: 0,
  }

  // Start heartbeat — POST to Next.js every 15s
  session.heartbeatInterval = setInterval(() => {
    void sendHeartbeat(instanceId)
  }, 15000)

  // Initial heartbeat
  void sendHeartbeat(instanceId)

  engines.set(instanceId, session)
  console.log(`[engine] registered: ${instanceId}`)
  return session
}

export function removeEngine(instanceId: string): void {
  const session = engines.get(instanceId)
  if (!session) return

  if (session.heartbeatInterval) clearInterval(session.heartbeatInterval)
  engines.delete(instanceId)
  console.log(`[engine] removed: ${instanceId}`)
}

export function getAllEngineIds(): string[] {
  return Array.from(engines.keys())
}
