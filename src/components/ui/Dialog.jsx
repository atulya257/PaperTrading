import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import './Dialog.css'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function Dialog({ open, onClose, title, placement = 'center', bare = false, children }) {
  const rootRef = useRef(null)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const opener = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const hidden = [...document.body.children]
      .filter((el) => el !== rootRef.current && !['SCRIPT', 'STYLE'].includes(el.tagName))
      .map((el) => ({ el, ariaHidden: el.getAttribute('aria-hidden'), inert: el.hasAttribute('inert') }))
    hidden.forEach(({ el }) => {
      el.setAttribute('aria-hidden', 'true')
      el.setAttribute('inert', '')
    })

    const panel = panelRef.current
    const first = panel?.querySelector('[data-autofocus]') ?? panel?.querySelector(FOCUSABLE)
    ;(first ?? panel)?.focus()

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const items = [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement)
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault()
        lastItem.focus()
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault()
        firstItem.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.body.style.overflow = previousOverflow
      hidden.forEach(({ el, ariaHidden, inert }) => {
        if (ariaHidden === null) el.removeAttribute('aria-hidden')
        else el.setAttribute('aria-hidden', ariaHidden)
        if (!inert) el.removeAttribute('inert')
      })
      if (opener instanceof HTMLElement) opener.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className={`dialog-root dialog-${placement}`} ref={rootRef}>
      <div className="dialog-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="dialog-panel" role="dialog" aria-modal="true" aria-label={title} ref={panelRef} tabIndex={-1}>
        {!bare && (
          <header className="dialog-header">
            <h2 className="dialog-title">{title}</h2>
            <button type="button" className="dialog-close" onClick={onClose} aria-label="Close">
              <X size={20} aria-hidden="true" />
            </button>
          </header>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}
