'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useInstanceStore, type Instance } from '@/store/instanceStore'

export default function InstancesPage() {
  const router = useRouter()
  const { instances, setInstances, loading, setLoading } = useInstanceStore()
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    fetch('/api/instances')
      .then((res) => res.json())
      .then((data) => setInstances(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [setInstances, setLoading])

  const handleCreate = useCallback(async () => {
    setError('')
    const res = await fetch('/api/instances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug, universeCount: 4 }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Failed to create')
      return
    }

    const created = await res.json()
    setInstances([{ ...created, role: 'owner' }, ...instances])
    setShowCreate(false)
    setName('')
    setSlug('')
  }, [name, slug, instances, setInstances])

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }, [router])

  function isOnline(instance: Instance): boolean {
    if (!instance.last_seen_at) return false
    return Date.now() - new Date(instance.last_seen_at).getTime() < 30000
  }

  function connectDirect(instance: Instance) {
    router.push(`/dashboard?instance=${instance.id}&mode=direct`)
  }

  function connectRelay(instance: Instance) {
    router.push(`/dashboard?instance=${instance.id}&mode=relay`)
  }

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: '#0a0a0a',
      color: '#f5f5f5',
    }}>
      {/* Header */}
      <header style={{
        height: '48px',
        backgroundColor: '#141414',
        borderBottom: '1px solid #2a2a2a',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: '#ff8811',
            display: 'inline-block',
            boxShadow: '0 0 6px #ff8811',
          }} />
          <span style={{
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '0.2em',
          }}>
            PHOTON
          </span>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: 'none',
            border: '1px solid #2a2a2a',
            color: '#a3a3a3',
            borderRadius: '4px',
            padding: '4px 12px',
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </header>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 16px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}>
          <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Engines</h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            style={{
              backgroundColor: '#ff8811',
              color: '#0a0a0a',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + New Engine
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div style={{
            backgroundColor: '#141414',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#a3a3a3', marginBottom: '4px' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
                  }}
                  placeholder="My Rig"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '4px',
                    color: '#f5f5f5',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#a3a3a3', marginBottom: '4px' }}>
                  Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="my-rig"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '4px',
                    color: '#f5f5f5',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {error && (
              <div style={{ fontSize: '12px', color: '#ef4444' }}>{error}</div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowCreate(false); setError('') }}
                style={{
                  background: 'none',
                  border: '1px solid #2a2a2a',
                  color: '#a3a3a3',
                  borderRadius: '4px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!name || !slug}
                style={{
                  backgroundColor: '#ff8811',
                  color: '#0a0a0a',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: !name || !slug ? 'not-allowed' : 'pointer',
                  opacity: !name || !slug ? 0.5 : 1,
                }}
              >
                Create
              </button>
            </div>
          </div>
        )}

        {/* Instance list */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#737373', padding: '40px' }}>Loading...</div>
        ) : instances.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#737373',
            padding: '60px 16px',
            backgroundColor: '#141414',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
          }}>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>No engines registered</div>
            <div style={{ fontSize: '12px' }}>Create an engine to get started</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {instances.map((instance) => (
              <div
                key={instance.id}
                style={{
                  backgroundColor: '#141414',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                {/* Status dot */}
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isOnline(instance) ? '#22c55e' : '#404040',
                  boxShadow: isOnline(instance) ? '0 0 5px #22c55e' : 'none',
                  flexShrink: 0,
                }} />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{instance.name}</div>
                  <div style={{ fontSize: '11px', color: '#737373', marginTop: '2px' }}>
                    {instance.slug} &middot; {instance.universe_count} universes &middot; {instance.role}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button
                    onClick={() => connectDirect(instance)}
                    style={{
                      backgroundColor: '#1e1e1e',
                      border: '1px solid #2a2a2a',
                      color: '#f5f5f5',
                      borderRadius: '4px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    Direct
                  </button>
                  <button
                    onClick={() => connectRelay(instance)}
                    disabled={!isOnline(instance)}
                    style={{
                      backgroundColor: isOnline(instance) ? '#ff8811' : '#1e1e1e',
                      border: isOnline(instance) ? 'none' : '1px solid #2a2a2a',
                      color: isOnline(instance) ? '#0a0a0a' : '#404040',
                      borderRadius: '4px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: isOnline(instance) ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Relay
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
