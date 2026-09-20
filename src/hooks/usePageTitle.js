import { useEffect } from 'react'
import { APP_NAME } from '../config/constants.js'

export function usePageTitle(title) {
  useEffect(() => {
    const previous = document.title
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME
    return () => {
      document.title = previous
    }
  }, [title])
}
