import { useCallback, useEffect, useRef, useState } from 'react'

export function useAsyncData(load, deps, { refreshMs = 0 } = {}) {
  const [nonce, setNonce] = useState(0)
  const key = `${JSON.stringify(deps)}#${nonce}`
  const [state, setState] = useState({ key: null, data: undefined, error: null })

  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  })

  useEffect(() => {
    let cancelled = false
    const run = () =>
      Promise.resolve()
        .then(() => loadRef.current())
        .then(
          (data) => !cancelled && setState({ key, data, error: null }),
          (error) => !cancelled && setState({ key, data: undefined, error }),
        )
    run()
    const timer = refreshMs ? setInterval(run, refreshMs) : null
    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
    }
  }, [key, refreshMs])

  const settled = state.key === key
  const reload = useCallback(() => setNonce((n) => n + 1), [])
  return {
    data: settled ? state.data : undefined,
    error: settled ? state.error : null,
    loading: !settled,
    reload,
  }
}
