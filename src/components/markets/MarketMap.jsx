import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMarketSnapshot, useStocks } from '../../hooks/useMarketData.js'
import { formatINR, formatPercent } from '../../utils/format.js'
import { squarify } from './treemap.js'
import './MarketMap.css'

const SECTOR_HEAD = 22 // px reserved for a sector's name when the block is tall enough
const GAP = 2

// Tiles go from slate (no change) to full green or red at a 2.5% move.
const FLAT = [61, 69, 82]
const UP = [10, 128, 69]
const DOWN = [196, 50, 40]
function tileColor(pct) {
  const t = Math.min(Math.abs(pct) / 2.5, 1) ** 0.75
  const to = pct >= 0 ? UP : DOWN
  const c = FLAT.map((f, i) => Math.round(f + (to[i] - f) * t))
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}

// Approximate width of a symbol in em, in the expanded heavy lettering; condensed lettering is about 0.7 of this
const WIDE_CHARS = { M: 1.15, W: 1.3, '&': 1.1, I: 0.4, J: 0.72 }
const textWidth = (symbol) => [...symbol].reduce((sum, ch) => sum + (WIDE_CHARS[ch] ?? 0.9), 0)
const CONDENSED = 0.7

/**
 * How to label a tile of width w and height h: wide lettering with the % change when there is room,
 * condensed lettering for long names in narrow tiles, or rotated text for tall thin tiles.
 */
function fitLabel(symbol, w, h) {
  const width = textWidth(symbol)
  const wide = Math.min((w - 10) / width, h / 3.1, 26)
  if (wide >= 11) return { mode: 'wide', size: wide, withPct: w >= 48 && h >= 36 }
  const condensed = Math.min((w - 8) / (width * CONDENSED), h / 3, 22)
  if (condensed >= 9) return { mode: 'condensed', size: condensed, withPct: w >= 40 && h >= condensed * 2.8 }
  if (h > w * 1.4) {
    const rotated = Math.min((h - 8) / (width * CONDENSED), w / 1.5, 18)
    if (rotated >= 7) return { mode: 'rotated', size: rotated, withPct: false }
  }
  const small = Math.min((w - 6) / (width * CONDENSED), h / 1.4, 12)
  if (small >= 7.5) return { mode: 'condensed', size: small, withPct: false }
  // Last resort for small tiles: the name over two lines
  const half = Math.ceil(symbol.length / 2)
  const longest = Math.max(textWidth(symbol.slice(0, half)), textWidth(symbol.slice(half)))
  const split = Math.min((w - 6) / (longest * CONDENSED), h / 2.6, 12)
  return split >= 7 ? { mode: 'split', size: split, withPct: false, lines: [symbol.slice(0, half), symbol.slice(half)] } : null
}

function useSize(ref) {
  const [size, setSize] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null
    observer?.observe(el)
    return () => observer?.disconnect()
  }, [ref])
  return size
}

export default function MarketMap({ linked = true, className = '' }) {
  const { quotes } = useMarketSnapshot()
  const stocks = useStocks()
  const boxRef = useRef(null)
  const { w, h } = useSize(boxRef)

  // The layout depends only on company values and the box size, so it stays still while prices tick.
  const layout = useMemo(() => {
    if (!w || !h) return []
    const bySector = new Map()
    for (const s of stocks) {
      if (!bySector.has(s.sector)) bySector.set(s.sector, [])
      bySector.get(s.sector).push(s)
    }
    const sectors = [...bySector.entries()]
      .map(([name, list]) => ({
        name,
        stocks: list.sort((a, b) => b.marketCap - a.marketCap),
        value: list.reduce((sum, s) => sum + s.marketCap, 0),
      }))
      .sort((a, b) => b.value - a.value)

    let order = 0
    return squarify(sectors, (s) => s.value, { x: 0, y: 0, w, h }).map((block) => {
      const showHead = block.h > 80 && block.w > 70
      const inner = {
        x: block.x + GAP,
        y: block.y + GAP + (showHead ? SECTOR_HEAD : 0),
        w: block.w - GAP * 2,
        h: block.h - GAP * 2 - (showHead ? SECTOR_HEAD : 0),
      }
      return {
        name: block.item.name,
        block,
        showHead,
        tiles: squarify(block.item.stocks, (s) => s.marketCap, inner).map((t) => ({ ...t, order: order++ })),
      }
    })
  }, [stocks, w, h])

  return (
    <div className={`mmap ${className}`}>
      <div className="mmap-box" ref={boxRef}>
        {layout.map((sector) => (
          <div key={sector.name} className="mmap-sector" role="list" aria-label={`${sector.name} sector`}>
            {sector.showHead && (
              <span
                className="mmap-sector-name"
                style={{ left: sector.block.x + GAP + 6, top: sector.block.y + GAP + 3, maxWidth: sector.block.w - 16 }}
                aria-hidden="true"
              >
                {sector.name}
              </span>
            )}
            {sector.tiles.map(({ item: s, x, y, w: tw, h: th, order }) => {
              const q = quotes[s.symbol]
              if (!q) return null
              const fit = fitLabel(s.symbol, tw - GAP, th - GAP)
              const showPct = fit?.withPct
              const showPrice = fit?.mode === 'wide' && tw >= 96 && th >= 70
              const label = `${s.symbol}, ${s.name}, ${formatINR(q.price)}, ${formatPercent(q.changePct)} today`
              const style = {
                left: x + GAP / 2,
                top: y + GAP / 2,
                width: Math.max(0, tw - GAP),
                height: Math.max(0, th - GAP),
                backgroundColor: tileColor(q.changePct),
                '--size': `${fit?.size ?? 0}px`,
                '--i': order,
              }
              const tileClass = `mmap-tile${fit && fit.mode !== 'wide' ? ` is-${fit.mode}` : ''}`
              const body = (
                <>
                  {fit && (
                    <span className="mmap-symbol">
                      {fit.lines ? (
                        <>
                          {fit.lines[0]}
                          <br />
                          {fit.lines[1]}
                        </>
                      ) : (
                        s.symbol
                      )}
                    </span>
                  )}
                  {showPct && <span className="mmap-pct num">{formatPercent(q.changePct)}</span>}
                  {showPrice && <span className="mmap-price num">{formatINR(q.price)}</span>}
                </>
              )
              return linked ? (
                <Link key={s.symbol} to={`/stock/${encodeURIComponent(s.symbol)}`} className={tileClass} style={style} role="listitem" aria-label={label} title={label}>
                  {body}
                </Link>
              ) : (
                <div key={s.symbol} className={tileClass} style={style} role="listitem" aria-label={label} title={label}>
                  {body}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <div className="mmap-legend" aria-hidden="true">
        <span className="mmap-scale">
          <span className="num">−2.5%</span>
          <span className="mmap-ramp" />
          <span className="num">+2.5%</span>
        </span>
      </div>
    </div>
  )
}
