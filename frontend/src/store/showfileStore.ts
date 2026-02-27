import { create } from 'zustand'
import { useDmxStore } from '@/store/dmxStore'
import { sendMessage } from '@/api/connection'

export interface Showfile {
  id: string
  name: string
  created_at: string
  updated_at: string
}

interface ShowfileState {
  showfiles: Showfile[]
  loading: boolean
  panelOpen: boolean

  setPanelOpen: (open: boolean) => void
  fetchShowfiles: (instanceId: string) => Promise<void>
  saveShowfile: (instanceId: string, name: string) => Promise<void>
  loadShowfile: (id: string) => Promise<void>
  deleteShowfile: (id: string) => Promise<void>
}

export const useShowfileStore = create<ShowfileState>((set, get) => ({
  showfiles: [],
  loading: false,
  panelOpen: false,

  setPanelOpen: (open) => set({ panelOpen: open }),

  fetchShowfiles: async (instanceId) => {
    set({ loading: true })
    try {
      const res = await fetch(`/api/showfiles?instanceId=${instanceId}`)
      if (res.ok) {
        const data = await res.json()
        set({ showfiles: data })
      }
    } finally {
      set({ loading: false })
    }
  },

  saveShowfile: async (instanceId, name) => {
    const channels = useDmxStore.getState().channels
    const data: Record<string, number[]> = {}
    for (const [k, v] of Object.entries(channels)) {
      data[k] = v
    }

    const res = await fetch('/api/showfiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceId, name, data }),
    })

    if (res.ok) {
      const showfile = await res.json()
      set({ showfiles: [showfile, ...get().showfiles] })
    }
  },

  loadShowfile: async (id) => {
    const res = await fetch(`/api/showfiles/${id}/load`, { method: 'POST' })
    if (!res.ok) return

    const { data } = await res.json() as { data: Record<string, number[]> }
    const dmxStore = useDmxStore.getState()

    for (const [universeStr, channels] of Object.entries(data)) {
      const universe = Number(universeStr)
      dmxStore.setChannels(universe, channels)

      // Send via WebSocket to engine
      const channelUpdates: [number, number][] = []
      for (let ch = 0; ch < channels.length; ch++) {
        if (channels[ch] !== 0) {
          channelUpdates.push([ch, channels[ch]])
        }
      }
      if (channelUpdates.length > 0) {
        sendMessage({
          type: 'set_channels',
          universe,
          channels: channelUpdates,
        })
      }
    }
  },

  deleteShowfile: async (id) => {
    const res = await fetch(`/api/showfiles/${id}`, { method: 'DELETE' })
    if (res.ok) {
      set({ showfiles: get().showfiles.filter((s) => s.id !== id) })
    }
  },
}))
