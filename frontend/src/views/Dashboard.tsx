import { useMemo } from 'react'
import { useDmxStore } from '../store/dmxStore'
import ChannelFader from '../components/ChannelFader'

const CHANNELS_PER_PAGE = 32

interface DashboardProps {
  page: number
  onPageChange: (page: number) => void
}

export default function Dashboard({ page, onPageChange: _onPageChange }: DashboardProps) {
  const activeUniverse = useDmxStore((s) => s.activeUniverse)
  const channelData = useDmxStore((s) => s.channels[activeUniverse])

  const channels = useMemo(
    () => channelData ?? new Array<number>(512).fill(0),
    [channelData]
  )

  const startIdx = page * CHANNELS_PER_PAGE
  const endIdx = Math.min(startIdx + CHANNELS_PER_PAGE, 512)
  const pageChannels = channels.slice(startIdx, endIdx)

  const nonZeroCount = useMemo(
    () => channels.filter((v) => v > 0).length,
    [channels]
  )

  const totalPages = Math.ceil(512 / CHANNELS_PER_PAGE)

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 16px 16px',
        gap: '16px',
        minHeight: 0,
      }}
    >
      {/* Fader grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(16, 1fr)',
          gap: '8px',
          alignItems: 'end',
        }}
        className="fader-grid"
      >
        <style>{`
          @media (max-width: 1200px) {
            .fader-grid {
              grid-template-columns: repeat(8, 1fr) !important;
            }
          }
          @media (max-width: 600px) {
            .fader-grid {
              grid-template-columns: repeat(4, 1fr) !important;
            }
          }
        `}</style>

        {pageChannels.map((value, localIdx) => {
          const channelIdx = startIdx + localIdx
          return (
            <ChannelFader
              key={channelIdx}
              universe={activeUniverse}
              channel={channelIdx}
              value={value}
            />
          )
        })}
      </div>

      {/* Summary bar */}
      <div
        style={{
          marginTop: 'auto',
          backgroundColor: '#141414',
          border: '1px solid #2a2a2a',
          borderRadius: '4px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          fontSize: '11px',
          color: '#a3a3a3',
        }}
      >
        <span>
          <span style={{ color: '#737373' }}>Universe</span>{' '}
          <span style={{ color: '#f5f5f5', fontWeight: 600 }}>{activeUniverse + 1}</span>
        </span>

        <span
          style={{
            width: '1px',
            height: '12px',
            backgroundColor: '#2a2a2a',
            display: 'inline-block',
          }}
        />

        <span>
          <span style={{ color: nonZeroCount > 0 ? '#ff8811' : '#737373', fontWeight: 600 }}>
            {nonZeroCount}
          </span>
          <span style={{ color: '#737373' }}> / 512 channels active</span>
        </span>

        <span
          style={{
            width: '1px',
            height: '12px',
            backgroundColor: '#2a2a2a',
            display: 'inline-block',
          }}
        />

        <span style={{ color: '#737373' }}>
          Page{' '}
          <span style={{ color: '#f5f5f5' }}>{page + 1}</span>
          {' / '}
          <span style={{ color: '#f5f5f5' }}>{totalPages}</span>
        </span>

        <span
          style={{
            width: '1px',
            height: '12px',
            backgroundColor: '#2a2a2a',
            display: 'inline-block',
          }}
        />

        <span style={{ color: '#737373' }}>
          Ch{' '}
          <span style={{ color: '#f5f5f5' }}>{startIdx + 1}</span>
          {' – '}
          <span style={{ color: '#f5f5f5' }}>{endIdx}</span>
        </span>
      </div>
    </div>
  )
}

export { CHANNELS_PER_PAGE }
