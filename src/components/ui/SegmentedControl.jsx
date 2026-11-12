import { useLayoutEffect, useRef, useState } from 'react'
import './SegmentedControl.css'

function useThumb(groupRef, value) {
  const [thumb, setThumb] = useState(null)

  useLayoutEffect(() => {
    const group = groupRef.current
    if (!group) return undefined
    const measure = () => {
      const pressed = group.querySelector('[aria-pressed="true"]')
      setThumb(pressed ? { x: pressed.offsetLeft, width: pressed.offsetWidth } : null)
    }
    measure()
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null
    observer?.observe(group)
    return () => observer?.disconnect()
  }, [groupRef, value])

  return thumb
}

export default function SegmentedControl({ label, options, value, onChange, size = 'md', className = '' }) {
  const groupRef = useRef(null)
  // The thumb is created at its measured position, so it slides only on later changes.
  const thumb = useThumb(groupRef, value)
  const tone = options.find((o) => o.value === value)?.tone ?? 'neutral'

  return (
    <div
      ref={groupRef}
      className={`segmented segmented-${size} ${className}`}
      role="group"
      aria-label={label}
      data-ready={thumb ? '' : undefined}
    >
      {thumb && (
        <span
          className={`segmented-thumb thumb-${tone}`}
          style={{ width: thumb.width, transform: `translateX(${thumb.x}px)` }}
          aria-hidden="true"
        />
      )}
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`segment${o.tone ? ` tone-${o.tone}` : ''}`}
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
