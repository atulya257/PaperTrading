import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import ToastViewport from '../components/ui/ToastViewport.jsx'

const ToastContext = createContext(null)
const DURATION = { success: 4000, info: 5000, error: 7000 }
const RESUME_MS = 2500
const MAX_VISIBLE = 4

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(1)
  const timers = useRef(new Map())
  const held = useRef(false)

  const dismiss = useCallback((id) => {
    const timer = timers.current.get(id)
    if (timer) clearTimeout(timer.timeout)
    timers.current.delete(id)
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const start = useCallback(
    (id, ms) => {
      const timeout = setTimeout(() => dismiss(id), ms)
      timers.current.set(id, { timeout })
    },
    [dismiss],
  )

  const show = useCallback(
    (type, title, message) => {
      const id = nextId.current++
      setToasts((list) => [...list.slice(-(MAX_VISIBLE - 1)), { id, type, title, message }])
      const ms = DURATION[type] ?? DURATION.info
      if (held.current) timers.current.set(id, { timeout: null })
      else start(id, ms)
      return id
    },
    [start],
  )

  const hold = useCallback(() => {
    if (held.current) return
    held.current = true
    for (const timer of timers.current.values()) clearTimeout(timer.timeout)
  }, [])

  const release = useCallback(() => {
    if (!held.current) return
    held.current = false
    for (const id of [...timers.current.keys()]) start(id, RESUME_MS)
  }, [start])

  const api = useMemo(
    () => ({
      success: (title, message) => show('success', title, message),
      error: (title, message) => show('error', title, message),
      info: (title, message) => show('info', title, message),
      dismiss,
    }),
    [show, dismiss],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} onHold={hold} onRelease={release} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
