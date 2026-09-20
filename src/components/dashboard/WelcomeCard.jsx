import { useMemo } from 'react'
import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'
import { useAccount } from '../../context/AccountContext.jsx'
import { useStocks } from '../../hooks/useMarketData.js'
import { formatINR } from '../../utils/format.js'
import './WelcomeCard.css'

export default function WelcomeCard() {
  const { account } = useAccount()
  const stocks = useStocks()
  const example = useMemo(() => [...stocks].sort((a, b) => b.marketCap - a.marketCap)[0], [stocks])

  const steps = [
    ['Explore', 'Browse the simulated market and open a stock to see its chart.'],
    ['Decide', 'Check the price, the day range and the news, then choose a quantity.'],
    ['Trade', 'Review and confirm. Your order fills instantly at the simulated price.'],
  ]

  return (
    <Card className="welcome">
      <div className="welcome-copy">
        <h2>Welcome to TradeLab</h2>
        <p>
          You have <strong className="num">{formatINR(account.cash)}</strong> of virtual cash and a simulated market that moves while you
          watch. Nothing here is real money.
        </p>
        <div className="welcome-actions">
          <Button to="/markets">Explore markets</Button>
          {example && (
            <Button to={`/stock/${encodeURIComponent(example.symbol)}`} variant="secondary">
              Look at {example.symbol}
            </Button>
          )}
        </div>
      </div>
      <ol className="welcome-steps">
        {steps.map(([title, text], i) => (
          <li key={title}>
            <span className="welcome-num num">{i + 1}</span>
            <div>
              <strong>{title}</strong>
              <p>{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  )
}
