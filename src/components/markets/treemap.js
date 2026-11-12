/**
 * Squarified treemap (Bruls, Huizing and van Wijk): splits a rectangle into tiles whose areas
 * are proportional to the items' values, keeping each tile as close to square as possible.
 * Items must be sorted largest first. Returns [{ item, x, y, w, h }].
 */
export function squarify(items, valueOf, { x, y, w, h }) {
  const total = items.reduce((sum, it) => sum + valueOf(it), 0)
  if (total <= 0 || w <= 0 || h <= 0) return []
  const scale = (w * h) / total
  const queue = items.map((item) => ({ item, area: valueOf(item) * scale }))
  const out = []
  let row = []

  // How far the worst tile in a row is from square, if the row is laid along a side of this length
  const worst = (tiles, side) => {
    const sum = tiles.reduce((s, t) => s + t.area, 0)
    let max = 0
    let min = Infinity
    for (const t of tiles) {
      if (t.area > max) max = t.area
      if (t.area < min) min = t.area
    }
    return Math.max((side * side * max) / (sum * sum), (sum * sum) / (side * side * min))
  }

  const placeRow = (tiles) => {
    const sum = tiles.reduce((s, t) => s + t.area, 0)
    if (w >= h) {
      // A column down the left edge
      const colW = sum / h
      let cy = y
      for (const t of tiles) {
        const th = t.area / colW
        out.push({ item: t.item, x, y: cy, w: colW, h: th })
        cy += th
      }
      x += colW
      w -= colW
    } else {
      // A row along the top edge
      const rowH = sum / w
      let cx = x
      for (const t of tiles) {
        const tw = t.area / rowH
        out.push({ item: t.item, x: cx, y, w: tw, h: rowH })
        cx += tw
      }
      y += rowH
      h -= rowH
    }
  }

  let i = 0
  while (i < queue.length) {
    const side = Math.min(w, h)
    const next = queue[i]
    if (row.length === 0 || worst([...row, next], side) <= worst(row, side)) {
      row.push(next)
      i += 1
    } else {
      placeRow(row)
      row = []
    }
  }
  if (row.length) placeRow(row)
  return out
}
