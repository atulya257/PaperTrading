import { createContext, useContext, useEffect, useState } from 'react'
import { createMarketProvider } from '../services/market/index.js'

const MarketContext = createContext(null)

export function MarketProvider({ provider: injected, children }) {
  const [provider] = useState(() => injected ?? createMarketProvider())

  useEffect(() => {
    provider.start()
    return () => provider.stop()
  }, [provider])

  return <MarketContext.Provider value={provider}>{children}</MarketContext.Provider>
}

export function useMarket() {
  const provider = useContext(MarketContext)
  if (!provider) throw new Error('useMarket must be used inside <MarketProvider>')
  return provider
}
