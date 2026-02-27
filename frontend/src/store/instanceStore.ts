import { create } from 'zustand'

export type ConnectionMode = 'direct' | 'relay'

export interface Instance {
  id: string
  name: string
  slug: string
  universe_count: number
  last_seen_at: string | null
  relay_token?: string
  role: string
  created_at: string
}

interface InstanceState {
  instances: Instance[]
  selectedInstanceId: string | null
  connectionMode: ConnectionMode
  loading: boolean

  setInstances: (instances: Instance[]) => void
  setInstance: (id: string, mode: ConnectionMode) => void
  clearInstance: () => void
  setLoading: (loading: boolean) => void
}

export const useInstanceStore = create<InstanceState>((set) => ({
  instances: [],
  selectedInstanceId: null,
  connectionMode: 'direct',
  loading: false,

  setInstances: (instances) => set({ instances }),
  setInstance: (id, mode) => set({ selectedInstanceId: id, connectionMode: mode }),
  clearInstance: () => set({ selectedInstanceId: null }),
  setLoading: (loading) => set({ loading }),
}))
