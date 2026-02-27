import { memo, useCallback, useRef } from 'react'
import { useDmxStore } from '../store/dmxStore'

interface ChannelFaderProps {
  universe: number
  channel: number
  value: number
}

function getFaderColor(value: number): string {
  if (value === 0) return '#1e3a5f'
  if (value <= 85) {
    // cool blue range
    const t = value / 85
    const r = Math.round(59 + t * (96 - 59))
    const g = Math.round(130 + t * (165 - 130))
    const b = Math.round(246 + t * (250 - 246))
    return `rgb(${r}, ${g}, ${b})`
  } else if (value <= 170) {
    // blue → amber transition
    const t = (value - 85) / 85
    const r = Math.round(96 + t * (245 - 96))
    const g = Math.round(165 + t * (158 - 165))
    const b = Math.round(250 + t * (11 - 250))
    return `rgb(${r}, ${g}, ${b})`
  } else {
    // amber → hot orange
    const t = (value - 170) / 85
    const r = Math.round(245 + t * (255 - 245))
    const g = Math.round(158 + t * (102 - 158))
    const b = Math.round(11 + t * (0 - 11))
    return `rgb(${r}, ${g}, ${b})`
  }
}

const FADER_HEIGHT = 160
const HANDLE_HEIGHT = 6

const ChannelFader = memo(function ChannelFader({ universe, channel, value }: ChannelFaderProps) {
  const setChannel = useDmxStore((s) => s.setChannel)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const rafId = useRef<number | null>(null)
  const pendingValue = useRef<number | null>(null)

  const fillPercent = (value / 255) * 100
  const color = getFaderColor(value)

  const computeValueFromY = useCallback((clientY: number): number => {
    const el = containerRef.current
    if (!el) return 0
    const rect = el.getBoundingClientRect()
    const relY = clientY - rect.top
    const clamped = Math.max(0, Math.min(relY, FADER_HEIGHT))
    // top = 255, bottom = 0
    return Math.round(255 - (clamped / FADER_HEIGHT) * 255)
  }, [])

  const flushPending = useCallback(() => {
    if (pendingValue.current !== null) {
      setChannel(universe, channel, pendingValue.current)
      pendingValue.current = null
    }
    rafId.current = null
  }, [universe, channel, setChannel])

  const scheduleUpdate = useCallback((val: number) => {
    pendingValue.current = val
    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(flushPending)
    }
  }, [flushPending])

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    dragging.current = true

    const initialVal = computeValueFromY(e.clientY)
    scheduleUpdate(initialVal)

    const onMouseMove = (me: MouseEvent) => {
      if (!dragging.current) return
      const val = computeValueFromY(me.clientY)
      scheduleUpdate(val)
    }

    const onMouseUp = () => {
      dragging.current = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [computeValueFromY, scheduleUpdate])

  const onDoubleClick = useCallback(() => {
    setChannel(universe, channel, 0)
  }, [universe, channel, setChannel])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Channel number */}
      <span
        style={{
          fontSize: '10px',
          color: '#737373',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
        }}
      >
        {channel + 1}
      </span>

      {/* Fader track */}
      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
        style={{
          width: '40px',
          height: `${FADER_HEIGHT}px`,
          backgroundColor: '#141414',
          border: '1px solid #2a2a2a',
          borderRadius: '2px',
          position: 'relative',
          cursor: 'ns-resize',
          overflow: 'hidden',
        }}
      >
        {/* Fill bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${fillPercent}%`,
            backgroundColor: color,
            transition: dragging.current ? 'none' : 'height 0.15s ease, background-color 0.15s ease',
          }}
        />

        {/* Handle line at top of fill */}
        {value > 0 && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: `calc(${fillPercent}% - ${HANDLE_HEIGHT / 2}px)`,
              height: `${HANDLE_HEIGHT}px`,
              backgroundColor: '#f5f5f5',
              opacity: 0.9,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {/* Value display */}
      <span
        style={{
          fontSize: '11px',
          fontVariantNumeric: 'tabular-nums',
          color: value > 0 ? '#f5f5f5' : '#737373',
          lineHeight: 1,
          minWidth: '28px',
          textAlign: 'center',
        }}
      >
        {value}
      </span>
    </div>
  )
})

export default ChannelFader
