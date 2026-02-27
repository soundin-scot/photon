'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { connect, disconnect } from '@/api/connection'
import { fetchConfig, fetchUniverses } from '@/api/rest'
import { useDmxStore } from '@/store/dmxStore'
import { useInstanceStore } from '@/store/instanceStore'
import Header from '@/components/Header'
import Dashboard from '@/views/Dashboard'
import ShowfilePanel from '@/components/ShowfilePanel'

const CHANNELS_PER_PAGE = 32
const TOTAL_PAGES = Math.ceil(512 / CHANNELS_PER_PAGE)

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const setUniverseCount = useDmxStore((s) => s.setUniverseCount)
  const setChannels = useDmxStore((s) => s.setChannels)
  const setInstance = useInstanceStore((s) => s.setInstance)
  const [page, setPage] = useState(0)

  const instanceId = searchParams.get('instance')
  const mode = (searchParams.get('mode') || 'direct') as 'direct' | 'relay'
  const directUrl = searchParams.get('url') || undefined

  useEffect(() => {
    if (instanceId) {
      setInstance(instanceId, mode)
    }

    connect({
      mode,
      directUrl,
      relayInstanceId: instanceId || undefined,
    })

    // In direct mode, also fetch via REST for initial state
    if (mode === 'direct') {
      void (async () => {
        try {
          const config = await fetchConfig()
          setUniverseCount(config.universeCount)
        } catch {
          // Backend may not be running yet; WebSocket will sync
        }

        try {
          const universes = await fetchUniverses()
          for (const u of universes) {
            setChannels(u.id, u.channels)
          }
        } catch {
          // Not fatal; WS will sync
        }
      })()
    }

    return () => {
      disconnect()
    }
  }, [instanceId, mode, directUrl, setUniverseCount, setChannels, setInstance])

  const handlePageChange = useCallback((p: number) => {
    setPage(p)
  }, [])

  return (
    <div style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0a0a0a',
      overflow: 'hidden',
    }}>
      <Header
        page={page}
        totalPages={TOTAL_PAGES}
        onPageChange={handlePageChange}
        channelsPerPage={CHANNELS_PER_PAGE}
      />
      <div style={{ height: '48px', flexShrink: 0 }} />
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        minHeight: 0,
      }}>
        <Dashboard page={page} channelsPerPage={CHANNELS_PER_PAGE} />
      </main>
      {instanceId && <ShowfilePanel />}
    </div>
  )
}
