import { useDmxStore } from '@/store/dmxStore'

type WsMessage = Record<string, unknown>

export interface ConnectionConfig {
  mode: 'direct' | 'relay'
  directUrl?: string
  relayUrl?: string
  relayInstanceId?: string
}

let socket: WebSocket | null = null
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
let reconnectDelay = 1000
const MAX_RECONNECT_DELAY = 10000
let shouldReconnect = true
let currentConfig: ConnectionConfig | null = null

const pendingMessages: WsMessage[] = []

function scheduleReconnect(): void {
  if (reconnectTimeout !== null) return
  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null
    if (shouldReconnect && currentConfig) {
      connectWithConfig(currentConfig)
    }
  }, reconnectDelay)
  reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY)
}

function handleMessage(event: MessageEvent): void {
  let data: WsMessage
  try {
    data = JSON.parse(event.data as string) as WsMessage
  } catch {
    return
  }

  const store = useDmxStore.getState()
  const type = data['type']

  if (type === 'dmx_state') {
    const universe = data['universe']
    const channels = data['channels']
    if (typeof universe === 'number' && Array.isArray(channels)) {
      store.setChannels(universe, channels as number[])
    }
  } else if (type === 'universes') {
    const count = data['count']
    if (typeof count === 'number') {
      store.setUniverseCount(count)
    }
  } else if (type === 'auth_ack') {
    // Relay auth acknowledged
  } else if (type === 'engine_offline') {
    // Engine disconnected from relay — keep WS open for reconnect
  }
}

function attachSocketEvents(): void {
  if (!socket) return

  socket.addEventListener('open', () => {
    reconnectDelay = 1000
    useDmxStore.getState().setConnected(true)

    // If relay mode, send auth message with token
    if (currentConfig?.mode === 'relay' && currentConfig.relayInstanceId) {
      // Token is passed via query param on connect, no separate auth message needed
    }

    while (pendingMessages.length > 0) {
      const msg = pendingMessages.shift()
      if (msg !== undefined && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(msg))
      }
    }
  })

  socket.addEventListener('message', handleMessage)

  socket.addEventListener('close', () => {
    useDmxStore.getState().setConnected(false)
    socket = null
    if (shouldReconnect) {
      scheduleReconnect()
    }
  })

  socket.addEventListener('error', () => {
    // close event will follow and trigger reconnect
  })
}

async function fetchRelayToken(instanceId: string): Promise<string> {
  const res = await fetch('/api/relay/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ instanceId }),
  })
  if (!res.ok) throw new Error('Failed to get relay token')
  const data = await res.json()
  return data.token
}

async function connectWithConfig(config: ConnectionConfig): Promise<void> {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return
  }

  if (config.mode === 'direct') {
    const url = config.directUrl || buildDirectUrl()
    socket = new WebSocket(url)
    attachSocketEvents()
  } else if (config.mode === 'relay') {
    if (!config.relayInstanceId) {
      throw new Error('relayInstanceId required for relay mode')
    }

    try {
      const token = await fetchRelayToken(config.relayInstanceId)
      const relayUrl = config.relayUrl || process.env.NEXT_PUBLIC_RELAY_URL || ''
      const wsUrl = `${relayUrl}/client?token=${encodeURIComponent(token)}`
      socket = new WebSocket(wsUrl)
      attachSocketEvents()
    } catch {
      // Schedule retry
      if (shouldReconnect) scheduleReconnect()
    }
  }
}

function buildDirectUrl(): string {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  const wsHost = backendUrl
    ? backendUrl.replace(/^https?:\/\//, '')
    : (typeof window !== 'undefined' ? window.location.host : 'localhost:9090')
  const wsProto = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${wsProto}://${wsHost}/ws`
}

// Public API — maintains backward compatibility with old connect/disconnect pattern

export function connect(config?: ConnectionConfig): void {
  shouldReconnect = true
  currentConfig = config || { mode: 'direct' }
  void connectWithConfig(currentConfig)
}

export function disconnect(): void {
  shouldReconnect = false
  currentConfig = null
  if (reconnectTimeout !== null) {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
  }
  if (socket) {
    socket.close()
    socket = null
  }
  useDmxStore.getState().setConnected(false)
}

export function sendMessage(msg: WsMessage): void {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(msg))
  } else {
    pendingMessages.push(msg)
  }
}
