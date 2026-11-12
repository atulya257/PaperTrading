import Button from '../components/ui/Button.jsx'
import MarketMap from '../components/markets/MarketMap.jsx'
import TickerTape from '../components/markets/TickerTape.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useStocks } from '../hooks/useMarketData.js'
import './Landing.css'

const STEPS = [
  { title: 'Start with ₹10,00,000', text: 'Create a free account with your email and a password.' },
  { title: 'Find a stock', text: 'Browse the market, open a chart and see how the price moved over a day, a month or a year.' },
  { title: 'Buy, sell and learn', text: 'Your holdings, profit and loss and order history update as prices move.' },
]

export default function Landing() {
  const { isAuthenticated } = useAuth()
  const stocks = useStocks()
  const sectorCount = new Set(stocks.map((s) => s.sector)).size

  return (
    <div className="landing">
      <header className="landing-top">
        <nav className="landing-nav" aria-label="Account">
          <Button to="/login" state={{ allowAuthenticated: true }} variant="ghost">
            Log in
          </Button>
          <Button to="/signup" state={{ allowAuthenticated: true }}>
            Sign up
          </Button>
        </nav>
      </header>
      <TickerTape linked={false} />

      <main id="main">
        <section className="hero">
          <div className="hero-copy">
            <h1 className="hero-title">Practise trading Indian stocks with ₹10 lakh of pretend money.</h1>
            <p className="hero-sub">
              TradeLab is a simulated market of {stocks.length} well-known NSE companies. Prices move every second, so you
              can learn how orders, holdings and profit and loss work without risking a rupee.
            </p>
            <div className="hero-actions">
              {isAuthenticated ? (
                <Button to="/dashboard" size="lg" variant="accent">
                  Go to dashboard
                </Button>
              ) : (
                <>
                  <Button to="/signup" size="lg" variant="accent">
                    Create an account
                  </Button>
                  <Button to="/login" state={{ allowAuthenticated: true }} size="lg" variant="secondary">
                    Log in
                  </Button>
                </>
              )}
            </div>
          </div>

          <figure className="hero-map">
            <MarketMap className="mmap-tall" />
          </figure>
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
              <dd>
                Buy straight away at the current price, or set your own price with a limit order and let it fill by
                itself.
              </dd>
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

    </div>
  )
}
