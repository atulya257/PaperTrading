import { LogoMark } from '../layout/Logo.jsx'
import './FullScreenLoader.css'

export default function FullScreenLoader({ label = 'Loading…' }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <div className="loader-mark">
        <LogoMark size={44} />
      </div>
      <p className="loader-label">{label}</p>
    </div>
  )
}
