import { Info, LineChart, Wallet, ShieldCheck } from 'lucide-react'
import Logo from './Logo.jsx'
import { DEMO_DISCLAIMER, INITIAL_CAPITAL } from '../../config/constants.js'
import { formatINR } from '../../utils/format.js'
import './AuthLayout.css'

const POINTS = [
  { icon: Wallet, text: `Start with ${formatINR(INITIAL_CAPITAL).replace('.00', '')} of virtual cash` },
  { icon: LineChart, text: 'Trade a simulated market that moves while you watch' },
  { icon: ShieldCheck, text: 'No real money, no broker, no risk' },
]

export function DemoAuthNotice() {
  return (
    <p className="auth-notice">
      <Info size={16} aria-hidden="true" />
      <span>
        <strong>Demo sign-in.</strong> There are no passwords: accounts are stored only in this browser and this is not
        secure authentication.
      </span>
    </p>
  )
}

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <aside className="auth-brand">
        <Logo />
        <div className="auth-brand-body">
          <h2>Practice investing. Risk nothing.</h2>
          <ul className="auth-points">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text}>
                <Icon size={20} aria-hidden="true" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="auth-brand-foot">{DEMO_DISCLAIMER}</p>
      </aside>

      <main className="auth-main" id="main">
        <div className="auth-mobile-logo">
          <Logo />
        </div>
        <div className="auth-card">
          <h1>{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
          {children}
          <DemoAuthNotice />
        </div>
        {footer && <p className="auth-footer">{footer}</p>}
      </main>
    </div>
  )
}
