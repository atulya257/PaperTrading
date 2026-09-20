export const APP_NAME = 'TradeLab'

export const PAISE_PER_RUPEE = 100
export const INITIAL_CAPITAL = 10_00_000 * PAISE_PER_RUPEE

export const STORAGE_VERSION = 1
export const STORAGE_KEYS = {
  session: 'tradelab:v1:session',
  users: 'tradelab:v1:users',
  account: (userId) => `tradelab:v1:account:${userId}`,
  market: 'tradelab:v1:market',
  prefs: 'tradelab:v1:prefs',
}

export const ACCOUNT_LIMITS = {
  WATCHLIST_MAX: 50,
  RECENT_MAX: 8,
  ORDERS_MAX: 1000,
  VALUE_HISTORY_MAX: 500,
  MAX_ORDER_QUANTITY: 100_000,
}

export const DEMO_LABEL = 'Simulated market'
export const DEMO_DISCLAIMER = 'Demo price — not real market data. No real money or broker is involved.'

export const PERIODS = ['1D', '1W', '1M', '3M', '6M', '1Y']
export const DEFAULT_PERIOD = '1M'

export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/markets', label: 'Markets' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/watchlist', label: 'Watchlist' },
  { to: '/orders', label: 'Orders' },
  { to: '/news', label: 'News' },
]

export const VALUE_SAMPLE_MS = 15_000
