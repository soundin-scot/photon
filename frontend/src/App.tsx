import { useEffect, useState, useCallback } from 'react'
import { connect, disconnect } from './api/websocket'
import { fetchConfig, fetchUniverses } from './api/rest'
import { useDmxStore } from './store/dmxStore'
import Header from './components/Header'
import Dashboard, { CHANNELS_PER_PAGE } from './views/Dashboard'

const TOTAL_PAGES = Math.ceil(512 / CHANNELS_PER_PAGE)

export default function App() {
  const setUniverseCount = useDmxStore((s) => s.setUniverseCount)
  const setChannels = useDmxStore((s) => s.setChannels)

  const [page, setPage] = useState(0)

  useEffect(() => {
    // Connect WebSocket
    connect()

    // Bootstrap from REST
    void (async () => {
      try {
        const config = await fetchConfig()
        setUniverseCount(config.universeCount)
      } catch {
        // Backend may not be running yet; WebSocket will sync state
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

    return () => {
      disconnect()
    }
  }, [setUniverseCount, setChannels])

  const handlePageChange = useCallback((p: number) => {
    setPage(p)
  }, [])

  return (
    <div
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0a0a0a',
        overflow: 'hidden',
      }}
    >
      <Header
        page={page}
        totalPages={TOTAL_PAGES}
        onPageChange={handlePageChange}
        channelsPerPage={CHANNELS_PER_PAGE}
      />

      {/* Offset for fixed header */}
      <div style={{ height: '48px', flexShrink: 0 }} />

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          minHeight: 0,
        }}
      >
        <Dashboard page={page} onPageChange={handlePageChange} />
      </main>
    </div>
  )
}
