import { useState } from 'react'
import { formatINR } from '../../utils/format.js'
import './LivePrice.css'

export default function LivePrice({ paise, className = '' }) {
  const [previous, setPrevious] = useState(paise)
  const [flash, setFlash] = useState({ direction: null, count: 0 })

  if (paise !== previous) {
    setPrevious(paise)
    setFlash({ direction: paise > previous ? 'up' : 'down', count: flash.count + 1 })
  }

  const flashClass = flash.direction ? ` flash-${flash.direction}-${flash.count % 2}` : ''
  return <span className={`live-price num${flashClass}${className ? ` ${className}` : ''}`}>{formatINR(paise)}</span>
}
