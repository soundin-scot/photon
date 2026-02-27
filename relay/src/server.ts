import { createServer, type IncomingMessage } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { URL } from 'url'
import { verifyClientToken } from './jwt.js'
import { registerEngine, removeEngine, getEngine } from './engine-registry.js'
import { addClient, removeClient, broadcastToClients, type ClientSession } from './client-registry.js'

const PORT = parseInt(process.env.PORT || '8080', 10)

// Lookup relay_token -> instanceId by querying Supabase via Next.js API
// For simplicity, the engine sends { type: "auth", relay_token } and we verify
// against the database.
const NEXT_API_URL = process.env.NEXT_API_URL || 'http://localhost:3000'
const RELAY_SERVICE_SECRET = process.env.RELAY_SERVICE_SECRET || ''

async function lookupRelayToken(relayToken: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${NEXT_API_URL}/api/relay/verify-engine`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-relay-secret': RELAY_SERVICE_SECRET,
        },
        body: JSON.stringify({ relayToken }),
      }
    )
    if (!res.ok) return null
    const data = await res.json() as { instanceId?: string }
    return data.instanceId ?? null
  } catch {
    return null
  }
}

// ─── HTTP Server ─────────────────────────────────────────────────

const server = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok' }))
    return
  }
  res.writeHead(404)
  res.end()
})

// ─── Engine WebSocket Server (/engine) ───────────────────────────

const engineWss = new WebSocketServer({ noServer: true })

engineWss.on('connection', (ws: WebSocket) => {
  let instanceId: string | null = null
  let authenticated = false

  // Engine must send auth within 10s
  const authTimeout = setTimeout(() => {
    if (!authenticated) {
      ws.close(4001, 'Auth timeout')
    }
  }, 10000)

  ws.on('message', (raw) => {
    let msg: Record<string, unknown>
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      return
    }

    if (!authenticated) {
      if (msg.type === 'auth' && typeof msg.relay_token === 'string') {
        void (async () => {
          const id = await lookupRelayToken(msg.relay_token as string)
          if (!id) {
            ws.close(4003, 'Invalid relay token')
            return
          }
          clearTimeout(authTimeout)
          instanceId = id
          authenticated = true
          registerEngine(instanceId, ws)
          ws.send(JSON.stringify({ type: 'auth_ack', instanceId }))
        })()
      }
      return
    }

    // Authenticated engine messages
    if (msg.type === 'dmx_state' || msg.type === 'universes') {
      // Forward to all connected browser clients
      const payload = raw.toString()
      if (instanceId) {
        if (msg.type === 'universes' && typeof msg.count === 'number') {
          const engine = getEngine(instanceId)
          if (engine) engine.universeCount = msg.count as number
        }
        if (msg.type === 'dmx_state' && typeof msg.universe === 'number') {
          const engine = getEngine(instanceId)
          if (engine) engine.lastState.set(msg.universe as number, payload)
        }
        broadcastToClients(instanceId, payload)
      }
    } else if (msg.type === 'heartbeat') {
      ws.send(JSON.stringify({ type: 'heartbeat_ack' }))
    }
  })

  ws.on('close', () => {
    clearTimeout(authTimeout)
    if (instanceId) {
      removeEngine(instanceId)
      // Notify connected clients
      broadcastToClients(instanceId, JSON.stringify({ type: 'engine_offline' }))
    }
  })

  ws.on('error', () => {
    // close event will follow
  })
})

// ─── Client WebSocket Server (/client) ──────────────────────────

const clientWss = new WebSocketServer({ noServer: true })

clientWss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
  const url = new URL(request.url || '/', `http://${request.headers.host}`)
  const token = url.searchParams.get('token')

  if (!token) {
    ws.close(4001, 'Missing token')
    return
  }

  void (async () => {
    const payload = await verifyClientToken(token)
    if (!payload) {
      ws.close(4003, 'Invalid token')
      return
    }

    const session: ClientSession = {
      ws,
      userId: payload.sub,
      instanceId: payload.instanceId,
    }

    addClient(session)
    ws.send(JSON.stringify({ type: 'auth_ack' }))

    // Send last known state if engine is connected
    const engine = getEngine(payload.instanceId)
    if (engine) {
      // Send universe count
      if (engine.universeCount > 0) {
        ws.send(JSON.stringify({ type: 'universes', count: engine.universeCount }))
      }
      // Send cached DMX state
      for (const [, statePayload] of engine.lastState) {
        ws.send(statePayload)
      }
    } else {
      ws.send(JSON.stringify({ type: 'engine_offline' }))
    }

    // Forward client commands to engine
    ws.on('message', (raw) => {
      let msg: Record<string, unknown>
      try {
        msg = JSON.parse(raw.toString())
      } catch {
        return
      }

      // Forward control messages to engine
      if (msg.type === 'set_channel' || msg.type === 'set_channels' || msg.type === 'blackout') {
        const eng = getEngine(payload.instanceId)
        if (eng && eng.ws.readyState === WebSocket.OPEN) {
          eng.ws.send(JSON.stringify({ type: 'command', data: msg }))
        }
      }
    })

    ws.on('close', () => {
      removeClient(session)
    })

    ws.on('error', () => {
      // close event will follow
    })
  })()
})

// ─── Upgrade Handling ────────────────────────────────────────────

server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '/', `http://${request.headers.host}`).pathname

  if (pathname === '/engine') {
    engineWss.handleUpgrade(request, socket, head, (ws) => {
      engineWss.emit('connection', ws, request)
    })
  } else if (pathname === '/client') {
    clientWss.handleUpgrade(request, socket, head, (ws) => {
      clientWss.emit('connection', ws, request)
    })
  } else {
    socket.destroy()
  }
})

// ─── Start ───────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`Photon relay listening on port ${PORT}`)
})
