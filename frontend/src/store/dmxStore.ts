import { create } from 'zustand'
import { sendMessage } from '@/api/websocket'

interface DmxState {
  universeCount: number
  channels: Record<number, number[]>
  connected: boolean
  activeUniverse: number

  setUniverseCount: (count: number) => void
  setChannels: (universe: number, channels: number[]) => void
  setChannel: (universe: number, channel: number, value: number) => void
  setConnected: (connected: boolean) => void
  setActiveUniverse: (universe: number) => void
  blackout: () => void
}

function makeEmptyUniverse(): number[] {
  return new Array<number>(512).fill(0)
}

export const useDmxStore = create<DmxState>((set, get) => ({
  universeCount: 1,
  channels: {},
  connected: false,
  activeUniverse: 0,

  setUniverseCount: (count) => {
    set((state) => {
      const channels = { ...state.channels }
      for (let i = 0; i < count; i++) {
        if (!channels[i]) {
          channels[i] = makeEmptyUniverse()
        }
      }
      return { universeCount: count, channels }
    })
  },

  setChannels: (universe, channels) => {
    set((state) => ({
      channels: {
        ...state.channels,
        [universe]: channels.length === 512 ? channels : [
          ...channels,
          ...new Array<number>(Math.max(0, 512 - channels.length)).fill(0)
        ]
      }
    }))
  },

  setChannel: (universe, channel, value) => {
    set((state) => {
      const universeChannels = state.channels[universe] ?? makeEmptyUniverse()
      const updated = [...universeChannels]
      updated[channel] = value
      return {
        channels: {
          ...state.channels,
          [universe]: updated
        }
      }
    })

    sendMessage({
      type: 'set_channel',
      universe,
      channel,
      value
    })
  },

  setConnected: (connected) => set({ connected }),

  setActiveUniverse: (universe) => {
    set({ activeUniverse: universe })
    const { channels } = get()
    if (!channels[universe]) {
      set((state) => ({
        channels: {
          ...state.channels,
          [universe]: makeEmptyUniverse()
        }
      }))
    }
  },

  blackout: () => {
    sendMessage({ type: 'blackout' })
    set((state) => {
      const zeroed: Record<number, number[]> = {}
      for (const key of Object.keys(state.channels)) {
        zeroed[Number(key)] = makeEmptyUniverse()
      }
      return { channels: zeroed }
    })
  }
}))
