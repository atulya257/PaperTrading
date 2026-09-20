import { useMemo } from 'react'
import { useAccount } from '../context/AccountContext.jsx'
import { computePortfolio } from '../engine/finance.js'
import { useMarketSnapshot, useStocks } from './useMarketData.js'

export function usePortfolio() {
  const { account } = useAccount()
  const { quotes } = useMarketSnapshot()
  const stocks = useStocks()

  const sectorOf = useMemo(() => {
    const bySymbol = new Map(stocks.map((s) => [s.symbol, s.sector]))
    return (symbol) => bySymbol.get(symbol)
  }, [stocks])

  return useMemo(() => computePortfolio(account, quotes, { sectorOf }), [account, quotes, sectorOf])
}
