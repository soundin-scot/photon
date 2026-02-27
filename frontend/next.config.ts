import type { NextConfig } from 'next'

const config: NextConfig = {
  async rewrites() {
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:9090'
    return [
      {
        source: '/api/:path*',
        destination: `${backend}/api/:path*`,
      },
    ]
  },
}

export default config
