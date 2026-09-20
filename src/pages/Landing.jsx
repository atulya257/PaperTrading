import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Calculator, HardDrive, Radio } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import MarketPreview from '../components/landing/MarketPreview.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useStocks } from '../hooks/useMarketData.js'
import './Landing.css'

const buildFeatures = (stockCount, sectorCount) => [
  {
    icon: Radio,
    title: 'A market that moves',
    text: 'Prices tick in real time from a simulator with market, sector and stock-level movement so your portfolio value and P&L change while you watch.',
  },
  {
    icon: Calculator,
    title: 'Real portfolio maths',
    text: 'Weighted average cost, realized and unrealized P&L, day P&L and allocation, calculated the way a broker would show them.',
  },
  {
    icon: BarChart3,
    title: 'Analyse, then trade',
    text: `Browse ${stockCount} demo stocks across ${sectorCount} sectors, study the chart, keep a watchlist and place instant buy and sell orders.`,
  },
  {
    icon: HardDrive,
    title: 'Private by design',
    text: 'Everything is stored in your own browser. No account server, no password, no real money and no broker connection.',
  },
]

const STEPS = [
  { title: 'Start with ₹10,00,000', text: 'Create a demo account, or jump straight in as a guest.' },
  { title: 'Find and analyse a stock', text: 'Browse the simulated market, open a chart and compare periods.' },
  { title: 'Buy, sell and learn', text: 'Watch your holdings, P&L and orders update as prices move.' },
]

export default function Landing() {
  const { isAuthenticated, guestLogin } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const stocks = useStocks()
  const features = useMemo(
    () => buildFeatures(stocks.length, new Set(stocks.map((s) => s.sector)).size),
    [stocks],
  )

  async function tryDemo() {
    setBusy(true)
    await guestLogin()
    navigate('/dashboard')
  }

  return (
    <div className="landing">
      <div className="landing-brand" aria-hidden="true">
        <span>TradeLab</span>
      </div>

      <main id="main">
        <section className="hero">
          <div className="hero-copy">
            <h1>
              Learn to trade the market.
              <br />
              <span className="hero-accent">Without risking a rupee.</span>
            </h1>
            <p className="hero-sub">
              TradeLab gives you ₹10,00,000 of virtual cash and a simulated stock market that moves in real time.
              Practise investing, build a portfolio and track your profit and loss, no real money involved.
            </p>
            <div className="hero-actions">
              {isAuthenticated ? (
                <Button to="/dashboard" size="lg">
                  Open dashboard
                </Button>
              ) : (
                <>
                  <Button size="lg" onClick={tryDemo} loading={busy}>
                    Try demo instantly
                  </Button>
                  <Button to="/signup" size="lg" variant="secondary">
                    Create account
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="hero-visual">
            <MarketPreview />
          </div>
        </section>

        <section className="section" aria-labelledby="features-title">
          <h2 id="features-title" className="section-title">
            Everything you need to practise
          </h2>
          <ul className="features">
            {features.map(({ icon: Icon, title, text }) => (
              <li key={title} className="feature">
                <span className="feature-icon">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="section" aria-labelledby="how-title">
          <h2 id="how-title" className="section-title">
            How it works
          </h2>
          <ol className="steps">
            {STEPS.map((step, i) => (
              <li key={step.title} className="step">
                <span className="step-number num">{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="section honesty" aria-labelledby="honest-title">
          <h2 id="honest-title" className="section-title">
            What TradeLab is — and is not
          </h2>
          <div className="honesty-grid">
            <div>
              <h3>It is</h3>
              <ul>
                <li>A learning tool with virtual money</li>
                <li>A simulated market driven by a mathematical model</li>
                <li>A demo: your data lives only in this browser</li>
              </ul>
            </div>
            <div>
              <h3>It is not</h3>
              <ul>
                <li>Real or live market data — every price is simulated</li>
                <li>Connected to any broker, exchange or bank</li>
                <li>Investment advice, or a prediction of real prices</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
      </footer>
    </div>
  )
}
