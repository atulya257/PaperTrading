import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

export default function RouteChangeHandler() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return undefined
    }
    if (navigationType !== 'POP') window.scrollTo(0, 0)

    const frame = requestAnimationFrame(() => {
      const target = document.querySelector('main h1') ?? document.querySelector('main')
      if (!(target instanceof HTMLElement)) return
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
      target.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname, navigationType])

  return null
}
