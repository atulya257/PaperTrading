import { PAISE_PER_RUPEE } from '../../config/constants.js'
import { STOCK_SERVICE_URL } from '../../config/services.js'
import { STOCKS } from './demo/stocks.js'

const TIMEOUT_MS = 3000

// How a stock moves when the Stock Service doesn't say (for example one added with a minimal POST).
const DEFAULT_SIM = { beta: 1, sectorLoad: 1, dailyVol: 0.014 }

function fromService(s) {
  const price = Number(s.price)
  if (typeof s.symbol !== 'string' || !s.symbol || !(price > 0)) return null
  return {
    symbol: s.symbol,
    name: s.name || s.symbol,
    sector: s.sector || 'Other',
    exchange: s.exchange || 'NSE',
    basePrice: Math.round(price * PAISE_PER_RUPEE),
    marketCapCr: s.marketCapCr > 0 ? s.marketCapCr : 10000,
    pe: Number.isFinite(s.pe) ? s.pe : null,
    description: s.description ?? '',
    sim: {
      beta: Number.isFinite(s.beta) ? s.beta : DEFAULT_SIM.beta,
      sectorLoad: Number.isFinite(s.sectorLoad) ? s.sectorLoad : DEFAULT_SIM.sectorLoad,
      dailyVol: s.dailyVol > 0 ? s.dailyVol : DEFAULT_SIM.dailyVol,
    },
  }
}

// Falls back to the built-in list when the Stock Service is not running
export async function loadStockCatalog() {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(`${STOCK_SERVICE_URL}/api/stocks`, { signal: controller.signal })
    if (!response.ok) throw new Error(`Stock Service answered ${response.status}`)
    const stocks = (await response.json()).map(fromService).filter(Boolean)
    if (stocks.length === 0) throw new Error('Stock Service returned no stocks')
    return { stocks, source: 'stock-service' }
  } catch {
    return { stocks: STOCKS, source: 'built-in' }
  } finally {
    clearTimeout(timer)
  }
}
