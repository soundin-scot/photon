import type { NextConfig } from 'next'

const config: NextConfig = {
  async rewrites() {
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:9090'
    return [
      // Proxy engine API routes to the C++ backend
      {
        source: '/api/config',
        destination: `${backend}/api/config`,
      },
      {
        source: '/api/universes/:path*',
        destination: `${backend}/api/universes/:path*`,
      },
      {
        source: '/api/blackout',
        destination: `${backend}/api/blackout`,
      },
      {
        source: '/api/devices/:path*',
        destination: `${backend}/api/devices/:path*`,
      },
    ]
  },
}

export default config
