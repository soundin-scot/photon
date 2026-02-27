import type WebSocket from 'ws'

export interface ClientSession {
  ws: WebSocket
  userId: string
  instanceId: string
}

// instanceId -> Set<ClientSession>
const clients = new Map<string, Set<ClientSession>>()

export function addClient(session: ClientSession): void {
  let set = clients.get(session.instanceId)
  if (!set) {
    set = new Set()
    clients.set(session.instanceId, set)
  }
  set.add(session)
  console.log(`[client] connected to ${session.instanceId} (total: ${set.size})`)
}

export function removeClient(session: ClientSession): void {
  const set = clients.get(session.instanceId)
  if (!set) return
  set.delete(session)
  if (set.size === 0) clients.delete(session.instanceId)
  console.log(`[client] disconnected from ${session.instanceId} (total: ${set?.size ?? 0})`)
}

export function getClients(instanceId: string): Set<ClientSession> {
  return clients.get(instanceId) ?? new Set()
}

export function broadcastToClients(instanceId: string, payload: string): void {
  const set = clients.get(instanceId)
  if (!set || set.size === 0) return

  for (const client of set) {
    try {
      if (client.ws.readyState === client.ws.OPEN) {
        client.ws.send(payload)
      }
    } catch { /* ignore send errors */ }
  }
}
