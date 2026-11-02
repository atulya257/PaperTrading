import { Link } from 'react-router-dom'
import { APP_NAME } from '../../config/constants.js'
import './Logo.css'

export function LogoMark({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="logo-mark">
      <rect width="32" height="32" rx="6" fill="#f0a83a" />
      <path
        d="M7 21l5.5-6 4.5 3.5L25 10"
        fill="none"
        stroke="#1b2430"
        strokeWidth="2.6"
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
