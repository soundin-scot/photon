import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Photon',
  description: 'Open-source real-time lighting engine',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
