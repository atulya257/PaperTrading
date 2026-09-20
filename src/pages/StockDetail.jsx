import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import StockChart from '../components/charts/StockChart.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Dialog from '../components/ui/Dialog.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import QuoteHeader from '../components/stock/QuoteHeader.jsx'
import StockStats from '../components/stock/StockStats.jsx'
import NewsList from '../components/stock/NewsList.jsx'
import PositionCard from '../components/trading/PositionCard.jsx'
import TradeTicket from '../components/trading/TradeTicket.jsx'
import { useAccount } from '../context/AccountContext.jsx'
import { useMarket } from '../context/MarketContext.jsx'
import { SIDE } from '../engine/trading.js'
import { useAsyncData } from '../hooks/useAsyncData.js'
import { useMediaQuery } from '../hooks/useMediaQuery.js'
import { useQuote, useStock } from '../hooks/useMarketData.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import './StockDetail.css'

export default function StockDetail() {
  const { symbol } = useParams()
  const stock = useStock(symbol)
  usePageTitle(stock ? `${stock.symbol} · ${stock.name}` : 'Stock not found')

  if (!stock) {
    return (
      <EmptyState
        icon={SearchX}
        title={`We could not find “${symbol}”`}
        action={
          <Button to="/markets" variant="secondary">
            Browse all stocks
          </Button>
        }
      >
        Check the symbol, or use the search bar to look up a company by name.
      </EmptyState>
    )
  }
  return <StockView key={stock.symbol} stock={stock} />
}

function StockView({ stock }) {
  const { symbol } = stock
  const quote = useQuote(symbol)
  const market = useMarket()
  const { markViewed } = useAccount()
  const wide = useMediaQuery('(min-width: 1024px)')
  const [sheet, setSheet] = useState({ open: false, side: SIDE.BUY })
  const news = useAsyncData(() => market.getNews({ symbol }), [symbol])

  useEffect(() => {
    markViewed(symbol)
  }, [symbol, markViewed])

  if (!quote) return null

  const openSheet = (side) => setSheet({ open: true, side })
  const closeSheet = () => setSheet((s) => ({ ...s, open: false }))

  return (
    <div className="stock-page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/markets">Markets</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{symbol}</span>
      </nav>

      <div className="stock-layout">
        <div className="stock-main">
          <QuoteHeader stock={stock} quote={quote} />
          <StockChart symbol={symbol} prevClose={quote.prevClose} />
          {!wide && <PositionCard symbol={symbol} />}
          <StockStats stock={stock} quote={quote} />
          <Card title={`About ${stock.name}`}>
            <p className="about-text">{stock.description}</p>
            <p className="about-note">Company details and figures are sample demo data.</p>
          </Card>
          <Card title={`${symbol} news`}>
            <NewsList items={news.data} error={news.error} onRetry={news.reload} />
          </Card>
        </div>

        {wide && (
          <aside className="stock-aside" aria-label={`Trade ${symbol}`}>
            <Card title={`Trade ${symbol}`}>
              <TradeTicket symbol={symbol} />
            </Card>
            <PositionCard symbol={symbol} />
          </aside>
        )}
      </div>

      {!wide && (
        <>
          <div className="trade-bar" role="group" aria-label={`Trade ${symbol}`}>
            <Button variant="loss" size="lg" onClick={() => openSheet(SIDE.SELL)}>
              Sell
            </Button>
            <Button variant="gain" size="lg" onClick={() => openSheet(SIDE.BUY)}>
              Buy
            </Button>
          </div>
          <Dialog open={sheet.open} onClose={closeSheet} title={`Trade ${symbol}`} placement="sheet">
            <div className="sheet-body">
              <TradeTicket symbol={symbol} initialSide={sheet.side} onExecuted={closeSheet} />
            </div>
          </Dialog>
        </>
      )}
    </div>
  )
}
