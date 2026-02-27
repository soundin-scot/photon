'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Login failed')
        return
      }

      router.push('/dashboard')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0a0a',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '360px',
        padding: '0 16px',
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '40px',
        }}>
          <span style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#ff8811',
            display: 'inline-block',
            boxShadow: '0 0 8px #ff8811',
          }} />
          <span style={{
            fontWeight: 700,
            fontSize: '18px',
            letterSpacing: '0.2em',
            color: '#f5f5f5',
          }}>
            PHOTON
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#a3a3a3', marginBottom: '6px' }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#141414',
                border: '1px solid #2a2a2a',
                borderRadius: '6px',
                color: '#f5f5f5',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#ff8811' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#2a2a2a' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#a3a3a3', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#141414',
                border: '1px solid #2a2a2a',
                borderRadius: '6px',
                color: '#f5f5f5',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#ff8811' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#2a2a2a' }}
            />
          </div>

          {error && (
            <div style={{
              fontSize: '13px',
              color: '#ef4444',
              backgroundColor: '#1a0a0a',
              border: '1px solid #7f1d1d',
              borderRadius: '6px',
              padding: '8px 12px',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px',
              backgroundColor: '#ff8811',
              color: '#0a0a0a',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div style={{ textAlign: 'center', fontSize: '13px', color: '#737373' }}>
            No account?{' '}
            <a
              href="/register"
              style={{ color: '#ff8811', textDecoration: 'none' }}
              onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline' }}
              onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none' }}
            >
              Register
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
