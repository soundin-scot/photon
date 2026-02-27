import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDmxStore } from '@/store/dmxStore'
import { useInstanceStore } from '@/store/instanceStore'
import UniverseSelector from '@/components/UniverseSelector'

interface HeaderProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  channelsPerPage: number
}

export default function Header({ page, totalPages, onPageChange, channelsPerPage }: HeaderProps) {
  const router = useRouter()
  const connected = useDmxStore((s) => s.connected)
  const blackout = useDmxStore((s) => s.blackout)
  const connectionMode = useInstanceStore((s) => s.connectionMode)
  const selectedInstanceId = useInstanceStore((s) => s.selectedInstanceId)
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => setUsername(data.username ?? null))
      .catch(() => {})
  }, [])

  const handleBlackout = useCallback(() => {
    blackout()
  }, [blackout])

  const handlePrev = useCallback(() => {
    onPageChange(Math.max(0, page - 1))
  }, [page, onPageChange])

  const handleNext = useCallback(() => {
    onPageChange(Math.min(totalPages - 1, page + 1))
  }, [page, totalPages, onPageChange])

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }, [router])

  const handleBack = useCallback(() => {
    router.push('/instances')
  }, [router])

  const startCh = page * channelsPerPage + 1
  const endCh = Math.min((page + 1) * channelsPerPage, 512)

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '48px',
        backgroundColor: '#141414',
        borderBottom: '1px solid #2a2a2a',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '16px',
        zIndex: 100,
        userSelect: 'none',
      }}
    >
      {/* Left: Logo + back */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {selectedInstanceId && (
          <button
            onClick={handleBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#a3a3a3',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '0 4px',
            }}
          >
            &larr;
          </button>
        )}
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: '#ff8811',
            display: 'inline-block',
            boxShadow: '0 0 6px #ff8811',
          }}
        />
        <span
          style={{
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '0.2em',
            color: '#f5f5f5',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          PHOTON
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '24px', backgroundColor: '#2a2a2a' }} />

      {/* Center: Universe selector + page nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        <UniverseSelector />

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={handlePrev}
            disabled={page === 0}
            style={{
              backgroundColor: page === 0 ? '#1a1a1a' : '#1e1e1e',
              color: page === 0 ? '#404040' : '#f5f5f5',
              border: '1px solid #2a2a2a',
              borderRadius: '4px',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: page === 0 ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              padding: 0,
            }}
          >
            &larr;
          </button>

          <span
            style={{
              fontSize: '11px',
              color: '#a3a3a3',
              minWidth: '72px',
              textAlign: 'center',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            Ch {startCh}&ndash;{endCh}
          </span>

          <button
            onClick={handleNext}
            disabled={page >= totalPages - 1}
            style={{
              backgroundColor: page >= totalPages - 1 ? '#1a1a1a' : '#1e1e1e',
              color: page >= totalPages - 1 ? '#404040' : '#f5f5f5',
              border: '1px solid #2a2a2a',
              borderRadius: '4px',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              padding: 0,
            }}
          >
            &rarr;
          </button>
        </div>

        {/* Connection mode badge */}
        {selectedInstanceId && (
          <span style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            padding: '2px 8px',
            borderRadius: '3px',
            backgroundColor: connectionMode === 'relay' ? '#ff881122' : '#22c55e22',
            color: connectionMode === 'relay' ? '#ff8811' : '#22c55e',
            border: `1px solid ${connectionMode === 'relay' ? '#ff881144' : '#22c55e44'}`,
          }}>
            {connectionMode}
          </span>
        )}
      </div>

      {/* Right: Connection status + user + Blackout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: connected ? '#22c55e' : '#ef4444',
              display: 'inline-block',
              boxShadow: connected ? '0 0 5px #22c55e' : '0 0 5px #ef4444',
            }}
          />
          <span style={{ fontSize: '11px', color: '#a3a3a3' }}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <button
          onClick={handleBlackout}
          style={{
            backgroundColor: '#7f1d1d',
            color: '#f5f5f5',
            border: '1px solid #991b1b',
            borderRadius: '4px',
            padding: '4px 14px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            cursor: 'pointer',
            textTransform: 'uppercase',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#991b1b'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#7f1d1d'
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.backgroundColor = '#b91c1c'
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.backgroundColor = '#991b1b'
          }}
        >
          BLACKOUT
        </button>

        {/* User + logout */}
        {username && (
          <>
            <div style={{ width: '1px', height: '24px', backgroundColor: '#2a2a2a' }} />
            <span style={{ fontSize: '11px', color: '#a3a3a3' }}>{username}</span>
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: '1px solid #2a2a2a',
                color: '#737373',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  )
}
