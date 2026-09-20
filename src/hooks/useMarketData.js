import { useMemo, useSyncExternalStore } from 'react'
import { useMarket } from '../context/MarketContext.jsx'

export function useMarketSnapshot() {
  const market = useMarket()
  return useSyncExternalStore(market.subscribe, market.getSnapshot)
}

export function useQuote(symbol) {
  const market = useMarket()
  return useSyncExternalStore(market.subscribe, () => market.getQuote(symbol))
}

export function useStocks() {
  const market = useMarket()
  return useMemo(() => market.getStocks(), [market])
}

export function useStock(symbol) {
  const stocks = useStocks()
  return useMemo(() => {
    const wanted = String(symbol ?? '').toUpperCase()
    return stocks.find((s) => s.symbol === wanted)
  }, [stocks, symbol])
}
