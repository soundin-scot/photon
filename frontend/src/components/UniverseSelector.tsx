import { useCallback } from 'react'
import { useDmxStore } from '../store/dmxStore'

export default function UniverseSelector() {
  const universeCount = useDmxStore((s) => s.universeCount)
  const activeUniverse = useDmxStore((s) => s.activeUniverse)
  const setActiveUniverse = useDmxStore((s) => s.setActiveUniverse)

  const onChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveUniverse(Number(e.target.value))
  }, [setActiveUniverse])

  return (
    <select
      value={activeUniverse}
      onChange={onChange}
      style={{
        backgroundColor: '#1e1e1e',
        color: '#f5f5f5',
        border: '1px solid #2a2a2a',
        borderRadius: '4px',
        padding: '4px 8px',
        fontSize: '12px',
        cursor: 'pointer',
        outline: 'none',
        appearance: 'none',
        WebkitAppearance: 'none',
        paddingRight: '24px',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23737373'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 8px center',
      }}
    >
      {Array.from({ length: universeCount }, (_, i) => (
        <option key={i} value={i}>
          Universe {i + 1}
        </option>
      ))}
    </select>
  )
}
