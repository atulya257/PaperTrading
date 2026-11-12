import { useSyncExternalStore } from 'react'
import { getTheme, setTheme, subscribeTheme } from '../services/theme.js'

export function useTheme() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme)
  return [theme, setTheme]
}
