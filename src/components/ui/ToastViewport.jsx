import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import './ToastViewport.css'

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info }

export default function ToastViewport({ toasts, onDismiss, onHold, onRelease }) {
  return (
    <div className="toast-viewport" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((t) => {
        const Icon = ICONS[t.type] ?? Info
        return (
          <div
            key={t.id}
            className={`toast toast-${t.type}`}
            role={t.type === 'error' ? 'alert' : 'status'}
            onMouseEnter={onHold}
            onMouseLeave={onRelease}
            onFocus={onHold}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) onRelease()
            }}
          >
            <Icon size={20} aria-hidden="true" className="toast-icon" />
            <div className="toast-body">
              <p className="toast-title">{t.title}</p>
              {t.message && <p className="toast-message">{t.message}</p>}
            </div>
            <button type="button" className="toast-close" onClick={() => onDismiss(t.id)} aria-label="Dismiss notification">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
