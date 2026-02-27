import { useDmxStore } from '@/store/dmxStore'

type WsMessage = Record<string, unknown>

let socket: WebSocket | null = null
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
let reconnectDelay = 1000
const MAX_RECONNECT_DELAY = 10000
let shouldReconnect = true

// Pending outbound messages buffered while disconnected
const pendingMessages: WsMessage[] = []

function scheduleReconnect(): void {
  if (reconnectTimeout !== null) return
  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null
    if (shouldReconnect) {
      connect()
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
  }
}

export function connect(): void {
  shouldReconnect = true

  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  const wsHost = backendUrl
    ? backendUrl.replace(/^https?:\/\//, '')
    : window.location.host
  const wsProto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const url = `${wsProto}://${wsHost}/ws`
  socket = new WebSocket(url)

  socket.addEventListener('open', () => {
    reconnectDelay = 1000
    useDmxStore.getState().setConnected(true)

    // Flush buffered messages
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

export function disconnect(): void {
  shouldReconnect = false
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
