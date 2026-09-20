import { Link } from 'react-router-dom'
import Card from '../ui/Card.jsx'
import NewsList from '../stock/NewsList.jsx'
import { useMarket } from '../../context/MarketContext.jsx'
import { useAsyncData } from '../../hooks/useAsyncData.js'
import './MiniList.css'

const SHOWN = 4
const REFRESH_MS = 20_000

export default function NewsPreview() {
  const market = useMarket()
  const news = useAsyncData(() => market.getNews({ limit: SHOWN }), [], { refreshMs: REFRESH_MS })
  return (
    <Card title="Latest headlines" actions={<Link to="/news" className="see-all">All news</Link>}>
      <NewsList items={news.data} error={news.error} onRetry={news.reload} compact />
      <p className="mini-more">Demo content: sample and simulated headlines, not real news.</p>
    </Card>
  )
}
