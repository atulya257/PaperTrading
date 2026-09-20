import { useMemo } from 'react'
import { useMarket } from '../context/MarketContext.jsx'
import { useQuote } from './useMarketData.js'
import { useAsyncData } from './useAsyncData.js'

const INTRADAY_REFRESH_MS = 5000

export function useHistory(symbol, period) {
  const market = useMarket()
  const quote = useQuote(symbol)
  const { data, loading, error, reload } = useAsyncData(() => market.getHistory(symbol, period), [symbol, period], {
    refreshMs: period === '1D' ? INTRADAY_REFRESH_MS : 0,
  })

  const points = useMemo(() => {
    if (!data || data.length === 0 || !quote) return data
    const last = data[data.length - 1]
    return last.price === quote.price ? data : [...data.slice(0, -1), { ...last, price: quote.price }]
  }, [data, quote])

  return { points, loading, error, reload }
}
