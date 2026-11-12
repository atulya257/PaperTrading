import { createContext, useContext, useEffect, useState } from 'react'
import { createMarketProvider } from '../services/market/index.js'
import { loadStockCatalog } from '../services/market/stockCatalog.js'
import FullScreenLoader from '../components/ui/FullScreenLoader.jsx'

const MarketContext = createContext(null)

export function MarketProvider({ provider: injected, children }) {
  const [provider, setProvider] = useState(injected ?? null)

  useEffect(() => {
    if (injected) return
    let cancelled = false
    loadStockCatalog().then(({ stocks, source }) => {
      if (!cancelled) setProvider(createMarketProvider({ stocks, catalogSource: source }))
    })
    return () => {
      cancelled = true
    }
  }, [injected])

  useEffect(() => {
    if (!provider) return undefined
    provider.start()
    return () => provider.stop()
  }, [provider])

  if (!provider) return <FullScreenLoader label="Loading stocks…" />
  return <MarketContext.Provider value={provider}>{children}</MarketContext.Provider>
}

export function useMarket() {
  const provider = useContext(MarketContext)
  if (!provider) throw new Error('useMarket must be used inside <MarketProvider>')
  return provider
}
