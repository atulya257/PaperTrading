import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import MarketPreview from '../components/landing/MarketPreview.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useStocks } from '../hooks/useMarketData.js'
import './Landing.css'

const STEPS = [
  { title: 'Start with ₹10,00,000', text: 'Create a free account, or try it as a guest without signing up.' },
  { title: 'Find a stock', text: 'Browse the market, open a chart and see how the price moved over a day, a month or a year.' },
  { title: 'Buy, sell and learn', text: 'Your holdings, profit and loss and order history update as prices move.' },
]

export default function Landing() {
  const { isAuthenticated, guestLogin } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const stocks = useStocks()
  const sectorCount = new Set(stocks.map((s) => s.sector)).size

  async function tryDemo() {
    setBusy(true)
    await guestLogin()
    navigate('/dashboard')
  }

  return (
    <div className="landing">
      <header className="landing-nav">
        <nav className="landing-nav-actions" aria-label="Account">
          <Button to="/dashboard" variant="ghost">
            Dashboard
          </Button>
          <Button to="/login" state={{ allowAuthenticated: true }} variant="ghost">
            Log in
          </Button>
          <Button to="/signup" state={{ allowAuthenticated: true }}>
            Sign up
          </Button>
        </nav>
      </header>

      <main id="main">
        <section className="hero">
          <div className="hero-copy">
            <h1 className="hero-name">TradeLab</h1>
            <p className="hero-title">Practise trading Indian stocks with ₹10 lakh of pretend money.</p>
            <p className="hero-sub">
              Buy and sell {stocks.length} well-known NSE companies in a simulated market whose prices move while you
              watch. Nothing you do here costs real money, so it is a safe place to learn how orders, holdings and
              profit and loss work.
            </p>
            <div className="hero-actions">
              {isAuthenticated ? (
                <Button to="/dashboard" size="lg">
                  Go to dashboard
                </Button>
              ) : (
                <>
                  <Button to="/signup" size="lg">
                    Create an account
                  </Button>
                  <Button size="lg" variant="secondary" onClick={tryDemo} loading={busy}>
                    Try it as a guest
                  </Button>
                </>
              )}
            </div>
          </div>
          <MarketPreview />
        </section>

        <section className="section" aria-labelledby="features-title">
          <h2 id="features-title" className="section-title">
            What you can do
          </h2>
          <dl className="features">
            <div>
              <dt>Watch a live market</dt>
              <dd>
                Prices update every second across {sectorCount} sectors, from banks and IT to steel and FMCG. The
                TradeLab index shows how the whole market is doing.
              </dd>
            </div>
            <div>
              <dt>Place buy and sell orders</dt>
              <dd>Pick a quantity, check the total and confirm. Orders fill straight away at the current price.</dd>
            </div>
            <div>
              <dt>Track your portfolio</dt>
              <dd>
                See your average buy price, today&apos;s change, and profit or loss on each holding, the way a real
                broker app shows it.
              </dd>
            </div>
            <div>
              <dt>Keep a watchlist</dt>
              <dd>Star the stocks you want to follow and check on them without buying anything.</dd>
            </div>
          </dl>
        </section>

        <section className="section" aria-labelledby="how-title">
          <h2 id="how-title" className="section-title">
            How it works
          </h2>
          <ol className="steps">
            {STEPS.map((step) => (
              <li key={step.title} className="step">
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="section honesty" aria-labelledby="honest-title">
          <h2 id="honest-title" className="section-title">
            Good to know
          </h2>
          <div className="honesty-grid">
            <div>
              <h3>TradeLab is</h3>
              <ul>
                <li>A practice tool that uses virtual money only</li>
                <li>A simulated market; prices come from a model, not the NSE</li>
                <li>Free to use, with your portfolio saved in your browser</li>
              </ul>
            </div>
            <div>
              <h3>TradeLab is not</h3>
              <ul>
                <li>Live market data</li>
                <li>Connected to any broker, exchange or bank</li>
                <li>Investment advice</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>TradeLab was built as a Full Stack Web Development course project. All prices are simulated.</p>
      </footer>
    </div>
  )
}
