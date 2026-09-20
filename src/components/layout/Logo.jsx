import { useId } from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME } from '../../config/constants.js'
import './Logo.css'

export function LogoMark({ size = 28 }) {
  const gradId = `tl-grad-${useId().replace(/:/g, '')}`
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="logo-mark">
      <defs>
        <linearGradient id={gradId} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#2dd4bf" />
          <stop offset="1" stopColor="#a3e635" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="var(--surface-2)" stroke="var(--border-strong)" />
      <path
        d="M6.5 21l5.5-6.5 5 4 8-10"
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Logo({ to = '/', showText = true }) {
  return (
    <Link to={to} className="logo" aria-label={`${APP_NAME} home`}>
      <LogoMark />
      {showText && <span className="logo-text">{APP_NAME}</span>}
    </Link>
  )
}
