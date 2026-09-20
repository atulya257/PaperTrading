const pad = (n) => String(n).padStart(2, '0')

export function dateKey(ms) {
  const d = new Date(ms)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function atTime(key, hour = 15, minute = 30) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, hour, minute, 0, 0).getTime()
}

function addDays(key, delta) {
  const [y, m, d] = key.split('-').map(Number)
  return dateKey(new Date(y, m - 1, d + delta, 12).getTime())
}

const isWeekend = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  const day = new Date(y, m - 1, d, 12).getDay()
  return day === 0 || day === 6
}

export function prevTradingDay(key) {
  let k = addDays(key, -1)
  while (isWeekend(k)) k = addDays(k, -1)
  return k
}

export function tradingDaysEndingAt(endKey, count) {
  const days = [endKey]
  while (days.length < count) days.push(prevTradingDay(days[days.length - 1]))
  return days.reverse()
}
