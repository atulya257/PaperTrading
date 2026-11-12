import { useLayoutEffect, useState } from 'react'

// When nothing is active the last position is kept but marked hidden, so the highlight fades out in place.
export function useActiveIndicator(containerRef, selector, key) {
  const [box, setBox] = useState(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return undefined
    const measure = () => {
      const active = container.querySelector(selector)
      setBox((prev) =>
        active
          ? { x: active.offsetLeft, y: active.offsetTop, width: active.offsetWidth, height: active.offsetHeight, hidden: false }
          : prev && { ...prev, hidden: true },
      )
    }
    measure()
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null
    observer?.observe(container)
    return () => observer?.disconnect()
  }, [containerRef, selector, key])

  return box
}
