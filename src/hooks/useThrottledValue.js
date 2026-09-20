import { useEffect, useRef, useState } from 'react'

export function useThrottledValue(value, ms, seriesKey = '') {
  const [shown, setShown] = useState({ seriesKey, value })
  const lastShownAt = useRef(0)

  if (shown.seriesKey !== seriesKey) setShown({ seriesKey, value })

  useEffect(() => {
    if (Object.is(shown.value, value)) return undefined
    const immediate = shown.value == null || value == null
    const wait = immediate ? 0 : Math.max(0, ms - (Date.now() - lastShownAt.current))
    const timer = setTimeout(() => {
      lastShownAt.current = Date.now()
      setShown({ seriesKey, value })
    }, wait)
    return () => clearTimeout(timer)
  }, [value, ms, seriesKey, shown.value])

  return shown.seriesKey === seriesKey ? shown.value : value
}
