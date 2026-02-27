'use client'

import { useCallback, useEffect, useState } from 'react'
import { useShowfileStore } from '@/store/showfileStore'
import { useInstanceStore } from '@/store/instanceStore'

export default function ShowfilePanel() {
  const { showfiles, loading, panelOpen, setPanelOpen, fetchShowfiles, saveShowfile, loadShowfile, deleteShowfile } =
    useShowfileStore()
  const instanceId = useInstanceStore((s) => s.selectedInstanceId)
  const [saveName, setSaveName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (panelOpen && instanceId) {
      void fetchShowfiles(instanceId)
    }
  }, [panelOpen, instanceId, fetchShowfiles])

  const handleSave = useCallback(async () => {
    if (!instanceId || !saveName.trim()) return
    setSaving(true)
    await saveShowfile(instanceId, saveName.trim())
    setSaveName('')
    setSaving(false)
  }, [instanceId, saveName, saveShowfile])

  const handleLoad = useCallback(
    (id: string) => {
      void loadShowfile(id)
    },
    [loadShowfile]
  )

  const handleDelete = useCallback(
    (id: string) => {
      void deleteShowfile(id)
    },
    [deleteShowfile]
  )

  if (!panelOpen) {
    return (
      <button
        onClick={() => setPanelOpen(true)}
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          backgroundColor: '#1e1e1e',
          border: '1px solid #2a2a2a',
          color: '#a3a3a3',
          borderRadius: '6px',
          padding: '8px 14px',
          fontSize: '12px',
          cursor: 'pointer',
          zIndex: 50,
        }}
      >
        Showfiles
      </button>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '48px',
        right: 0,
        bottom: 0,
        width: '320px',
        backgroundColor: '#141414',
        borderLeft: '1px solid #2a2a2a',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 90,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #2a2a2a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#f5f5f5' }}>Showfiles</span>
        <button
          onClick={() => setPanelOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#737373',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '0 4px',
          }}
        >
          &times;
        </button>
      </div>

      {/* Save form */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #2a2a2a',
          display: 'flex',
          gap: '8px',
        }}
      >
        <input
          type="text"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          placeholder="Show name..."
          style={{
            flex: 1,
            padding: '6px 10px',
            backgroundColor: '#0a0a0a',
            border: '1px solid #2a2a2a',
            borderRadius: '4px',
            color: '#f5f5f5',
            fontSize: '12px',
            outline: 'none',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleSave()
          }}
        />
        <button
          onClick={handleSave}
          disabled={!saveName.trim() || saving}
          style={{
            backgroundColor: '#ff8811',
            color: '#0a0a0a',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: !saveName.trim() || saving ? 'not-allowed' : 'pointer',
            opacity: !saveName.trim() || saving ? 0.5 : 1,
          }}
        >
          Save
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#737373', padding: '20px', fontSize: '12px' }}>
            Loading...
          </div>
        ) : showfiles.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#737373', padding: '20px', fontSize: '12px' }}>
            No showfiles saved
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {showfiles.map((sf) => (
              <div
                key={sf.id}
                style={{
                  backgroundColor: '#1e1e1e',
                  border: '1px solid #2a2a2a',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#f5f5f5' }}>{sf.name}</div>
                  <div style={{ fontSize: '10px', color: '#737373', marginTop: '2px' }}>
                    {new Date(sf.updated_at).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => handleLoad(sf.id)}
                  style={{
                    backgroundColor: '#22c55e22',
                    border: '1px solid #22c55e44',
                    color: '#22c55e',
                    borderRadius: '3px',
                    padding: '3px 8px',
                    fontSize: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Load
                </button>
                <button
                  onClick={() => handleDelete(sf.id)}
                  style={{
                    backgroundColor: '#ef444422',
                    border: '1px solid #ef444444',
                    color: '#ef4444',
                    borderRadius: '3px',
                    padding: '3px 8px',
                    fontSize: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Del
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
