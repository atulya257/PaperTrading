import { useState } from 'react'
import { Info } from 'lucide-react'
import Card from '../components/ui/Card.jsx'
import SegmentedControl from '../components/ui/SegmentedControl.jsx'
import NewsList from '../components/stock/NewsList.jsx'
import { useAccount } from '../context/AccountContext.jsx'
import { useMarket } from '../context/MarketContext.jsx'
import { useAsyncData } from '../hooks/useAsyncData.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import './News.css'

const REFRESH_MS = 10_000
const FILTERS = [
  { value: 'ALL', label: 'All news' },
  { value: 'MINE', label: 'My stocks' },
  { value: 'SIMULATED', label: 'Simulated' },
]
const EMPTY_TEXT = {
  ALL: 'No news yet.',
  MINE: 'No news for your stocks yet. Buy or watch more stocks to see more here.',
  SIMULATED: 'No simulated headlines yet — one appears every few minutes while the market is running.',
}

export default function News() {
  usePageTitle('News')
  const market = useMarket()
  const { account } = useAccount()
  const [filter, setFilter] = useState('ALL')
  const news = useAsyncData(() => market.getNews({ limit: 100 }), [], { refreshMs: REFRESH_MS })

  const mine = new Set([...Object.keys(account.holdings), ...account.watchlist])
  const items = news.data?.filter((n) => {
    if (filter === 'MINE') return n.symbols.some((s) => mine.has(s))
    if (filter === 'SIMULATED') return n.source === 'Simulated'
    return true
  })

  return (
    <div className="news-page">
      <header className="page-head">
        <h1>News</h1>
        <p className="page-sub">Market headlines — all of them are demo content.</p>
      </header>

      <div className="news-filters">
        <SegmentedControl label="Filter news" options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      <Card>
        <NewsList items={items} error={news.error} onRetry={news.reload} emptyText={EMPTY_TEXT[filter]} />
      </Card>
    </div>
  )
}
